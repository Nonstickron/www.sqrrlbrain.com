/**
 * Firebase Cloud Functions — waitlist autosync
 *
 * Triggers on Firestore document create for the four waitlist collections
 * and fans out to:
 *   - Kit (ConvertKit v4 API) — adds subscriber with collection-specific tag
 *   - Discord webhook — posts a real-time notification of the signup
 *
 * Both are gated by env vars (see functions/.env.example). If a key isn't
 * set, that fan-out is a silent no-op and the function still succeeds.
 *
 * Env vars (set via `firebase functions:secrets:set` or .env):
 *   KIT_API_KEY            — your Kit V4 API key (Account → Settings → Advanced)
 *   KIT_TAG_INKWELL        — tag ID for inkwell_waitlist signups
 *   KIT_TAG_SQRRLEDAWAY    — tag ID for sqrrledaway_waitlist signups
 *   KIT_TAG_SITE_NOTIFY    — tag ID for site_notify_waitlist signups
 *   KIT_TAG_CONTACT        — tag ID for contact_messages signups
 *   DISCORD_WEBHOOK_URL    — Discord channel webhook URL
 *
 * Deploy:
 *   firebase deploy --only functions
 *
 * Local test:
 *   firebase emulators:start --only functions,firestore
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");

const KIT_API_BASE = "https://api.kit.com/v4";

// Map collection name → env var name for the Kit tag ID
const COLLECTION_TAG_ENV = {
  inkwell_waitlist:     "KIT_TAG_INKWELL",
  sqrrledaway_waitlist: "KIT_TAG_SQRRLEDAWAY",
  site_notify_waitlist: "KIT_TAG_SITE_NOTIFY",
  contact_messages:     "KIT_TAG_CONTACT",
};

// Friendly labels for Discord notifications
const COLLECTION_LABELS = {
  inkwell_waitlist:     "Inkwell waitlist",
  sqrrledaway_waitlist: "SqrrledAway waitlist",
  site_notify_waitlist: "Site notify waitlist (login-page denial)",
  contact_messages:     "Contact form",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function addToKit(email, tagEnvName) {
  const apiKey = process.env.KIT_API_KEY;
  const tagId  = process.env[tagEnvName];
  if (!apiKey) {
    logger.info("Kit fan-out skipped (KIT_API_KEY not set)");
    return { skipped: true };
  }
  if (!tagId) {
    logger.warn(`Kit fan-out skipped: ${tagEnvName} not set; subscriber created without tag`);
  }

  // 1. Create-or-update subscriber
  const subRes = await fetch(`${KIT_API_BASE}/subscribers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Kit-Api-Key": apiKey,
    },
    body: JSON.stringify({ email_address: email, state: "active" }),
  });

  if (!subRes.ok) {
    const text = await subRes.text();
    throw new Error(`Kit subscriber create failed: ${subRes.status} ${text.slice(0, 300)}`);
  }
  const subJson = await subRes.json();
  const subscriberId = subJson?.subscriber?.id;
  if (!subscriberId) {
    throw new Error(`Kit subscriber create returned no id: ${JSON.stringify(subJson).slice(0, 300)}`);
  }

  // 2. Apply tag (if we have one)
  if (tagId) {
    const tagRes = await fetch(`${KIT_API_BASE}/tags/${tagId}/subscribers/${subscriberId}`, {
      method: "POST",
      headers: { "X-Kit-Api-Key": apiKey },
    });
    if (!tagRes.ok) {
      const text = await tagRes.text();
      throw new Error(`Kit tag apply failed: ${tagRes.status} ${text.slice(0, 300)}`);
    }
  }

  return { subscriberId, tagged: !!tagId };
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

      const tagEnv = COLLECTION_TAG_ENV[collection];

      // Run both fan-outs in parallel; collect errors but don't crash the function
      const [kitRes, discordRes] = await Promise.allSettled([
        addToKit(email, tagEnv),
        notifyDiscord(collection, email, source, extra),
      ]);

      if (kitRes.status === "rejected") {
        logger.error(`Kit fan-out failed for ${collection}`, { email, error: kitRes.reason?.message });
      } else {
        logger.info(`Kit fan-out OK for ${collection}`, { email, result: kitRes.value });
      }
      if (discordRes.status === "rejected") {
        logger.error(`Discord fan-out failed for ${collection}`, { email, error: discordRes.reason?.message });
      } else {
        logger.info(`Discord fan-out OK for ${collection}`, { email, result: discordRes.value });
      }
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
