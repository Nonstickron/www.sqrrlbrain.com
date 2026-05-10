/**
 * Firebase Cloud Functions — waitlist autosync + contact-form forwarder
 *
 * Triggers on Firestore document create for the four collections and fans
 * out to:
 *   - Kit (ConvertKit V4 Forms API) — one shared newsletter form for the
 *     three waitlist collections. Kit sends the double-opt-in confirmation
 *     email automatically when the form is configured for double opt-in.
 *     Per-collection `source` recorded as a Kit custom field.
 *   - Discord webhook — real-time signup notification for ALL four
 *     collections (including contact_messages).
 *   - Resend (transactional email) — for contact_messages ONLY, forwards
 *     the message to hello@sqrrlbrain.com (or whatever CONTACT_TO_EMAIL is
 *     set to). Sets Reply-To header to the contacter's email so Ron can
 *     reply directly from his inbox.
 *
 * Each fan-out gated by env vars (see functions/.env.example). If a key
 * isn't set, that fan-out is a silent no-op.
 *
 * NOTE on contact_messages: contact-form submissions are NOT auto-added
 * to the newsletter (someone messaging support didn't necessarily opt
 * into marketing). Email + Discord only.
 *
 * Env vars (set via .env or `firebase functions:secrets:set`):
 *   KIT_API_KEY            — Kit V4 API key (Account → Settings → Advanced)
 *   KIT_FORM_ID            — Kit form ID for the unified newsletter signup
 *                            (form must be configured for double opt-in)
 *   DISCORD_WEBHOOK_URL    — Discord channel webhook URL
 *   RESEND_API_KEY         — Resend API key for transactional email
 *                            (resend.com → API Keys; free tier = 3K/mo)
 *   EMAIL_FROM             — From address for outbound contact-form forwards
 *                            (default: 'Sqrrlbrain Contact <onboarding@resend.dev>')
 *                            Once you verify sqrrlbrain.com in Resend, set
 *                            this to e.g. 'Sqrrlbrain Contact <hello@sqrrlbrain.com>'
 *   CONTACT_TO_EMAIL       — destination for contact-form forwards
 *                            (default: hello@sqrrlbrain.com)
 *
 * Deploy:
 *   firebase deploy --only functions
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");

const KIT_API_BASE = "https://api.kit.com/v4";

// Friendly labels for Discord notifications
const COLLECTION_LABELS = {
  inkwell_waitlist:     "Inkwell waitlist",
  sqrrledaway_waitlist: "SqrrledAway waitlist",
  site_notify_waitlist: "Site notify waitlist (login-page denial)",
  contact_messages:     "Contact form",
};

// Collections that push to the Kit newsletter list.
// contact_messages is intentionally absent — see header comment.
const KIT_NEWSLETTER_COLLECTIONS = new Set([
  "inkwell_waitlist",
  "sqrrledaway_waitlist",
  "site_notify_waitlist",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function addToKitNewsletter(email, source) {
  const apiKey = process.env.KIT_API_KEY;
  const formId = process.env.KIT_FORM_ID;
  if (!apiKey) {
    logger.info("Kit fan-out skipped (KIT_API_KEY not set)");
    return { skipped: true };
  }
  if (!formId) {
    logger.warn("Kit fan-out skipped (KIT_FORM_ID not set)");
    return { skipped: true };
  }

  // POST to the form's subscribers endpoint — Kit sends the double-opt-in
  // confirmation email automatically when the form is configured for it.
  const res = await fetch(`${KIT_API_BASE}/forms/${formId}/subscribers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Kit-Api-Key": apiKey,
    },
    body: JSON.stringify({
      email_address: email,
      // Kit accepts custom fields here if defined on the account — `source`
      // gives Ron the option to segment later by where they signed up.
      fields: source ? { source } : undefined,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kit form subscribe failed: ${res.status} ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  return { subscriberId: json?.subscriber?.id, source };
}

async function forwardContactEmail({ name, email, subject, message }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.info("Resend fan-out skipped (RESEND_API_KEY not set)");
    return { skipped: true };
  }
  const from = process.env.EMAIL_FROM || "Sqrrlbrain Contact <onboarding@resend.dev>";
  const to   = process.env.CONTACT_TO_EMAIL || "hello@sqrrlbrain.com";

  const subj = `[sqrrlbrain.com] ${subject || "Contact form message"}`;
  // Plain-text body — keeps it deliverable + readable in any client.
  const body = [
    `From: ${name || "(no name)"} <${email}>`,
    subject ? `Subject: ${subject}` : null,
    "",
    "----",
    "",
    message || "(no message)",
    "",
    "----",
    `Sent via the contact form on https://sqrrlbrain.com`,
    `Reply directly to this email — it'll go to ${email}`,
  ].filter((line) => line !== null).join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: subj,
      text: body,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend send failed: ${res.status} ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  return { sent: true, id: json?.id };
}

async function notifyDiscord(collection, email, source, extra) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    logger.info("Discord fan-out skipped (DISCORD_WEBHOOK_URL not set)");
    return { skipped: true };
  }

  const label = COLLECTION_LABELS[collection] || collection;
  const lines = [
    `**[${label}]** new signup`,
    `\`${email}\``,
  ];
  if (source) lines.push(`source: \`${source}\``);
  if (extra)  lines.push(extra);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: lines.join("\n") }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord webhook failed: ${res.status} ${text.slice(0, 300)}`);
  }
  return { sent: true };
}

// ---------------------------------------------------------------------------
// Trigger factory — one trigger per collection
// ---------------------------------------------------------------------------

function makeTrigger(collection) {
  return onDocumentCreated(
    {
      document: `${collection}/{docId}`,
      region: "us-central1",
    },
    async (event) => {
      const data  = event.data?.data() || {};
      const email = (data.email || "").trim();
      const source = data.source || null;

      if (!email || !email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
        logger.warn(`Skipping ${collection}/${event.params.docId}: invalid email`, { email });
        return;
      }

      // For contact_messages, include the message subject in the Discord ping
      let extra = null;
      if (collection === "contact_messages") {
        const subject = (data.subject || "").slice(0, 120);
        const msg = (data.message || "").slice(0, 200);
        if (subject) extra = `subject: "${subject}"`;
        if (msg)     extra = (extra ? extra + "\n" : "") + `message: "${msg}…"`;
      }

      // Build fan-out tasks. Each is labeled so error logging stays useful.
      const tasks = [];
      tasks.push({ name: "Discord", run: () => notifyDiscord(collection, email, source, extra) });
      if (KIT_NEWSLETTER_COLLECTIONS.has(collection)) {
        tasks.push({ name: "Kit", run: () => addToKitNewsletter(email, source || collection) });
      }
      if (collection === "contact_messages") {
        tasks.push({
          name: "Resend",
          run: () => forwardContactEmail({
            name: data.name,
            email,
            subject: data.subject,
            message: data.message,
          }),
        });
      }

      // Run fan-outs in parallel; collect errors but don't crash the function
      const results = await Promise.allSettled(tasks.map((t) => t.run()));

      results.forEach((r, idx) => {
        const name = tasks[idx].name;
        if (r.status === "rejected") {
          logger.error(`${name} fan-out failed for ${collection}`, { email, error: r.reason?.message });
        } else {
          logger.info(`${name} fan-out OK for ${collection}`, { email, result: r.value });
        }
      });
    }
  );
}

// ---------------------------------------------------------------------------
// Exports — one function per collection
// ---------------------------------------------------------------------------

exports.onInkwellWaitlistCreate     = makeTrigger("inkwell_waitlist");
exports.onSqrrledawayWaitlistCreate = makeTrigger("sqrrledaway_waitlist");
exports.onSiteNotifyWaitlistCreate  = makeTrigger("site_notify_waitlist");
exports.onContactMessageCreate      = makeTrigger("contact_messages");
