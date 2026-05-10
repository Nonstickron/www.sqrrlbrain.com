# Sqrrlbrain Cloud Functions

Firebase Cloud Functions that trigger on waitlist signups in Firestore and fan out to:
- **Kit (ConvertKit)** — adds subscriber to the email list with a collection-specific tag
- **Discord webhook** — posts a real-time notification of the signup

Each fan-out is independently gated by an env var. If you don't set the Kit key, no Kit calls happen. Same for Discord. Function deploys safely either way.

## Watched collections

| Firestore collection | Kit tag env var | Discord label |
|---|---|---|
| `inkwell_waitlist` | `KIT_TAG_INKWELL` | "Inkwell waitlist" |
| `sqrrledaway_waitlist` | `KIT_TAG_SQRRLEDAWAY` | "SqrrledAway waitlist" |
| `site_notify_waitlist` | `KIT_TAG_SITE_NOTIFY` | "Site notify waitlist (login-page denial)" |
| `contact_messages` | `KIT_TAG_CONTACT` | "Contact form" |

---

## First-time setup

### 1. Sign up for Kit and grab API + tag IDs

1. Sign up at https://kit.com (free, 10K subscribers on free tier)
2. **Account → Settings → Advanced → API → V4 API Key** — copy this
3. Create 4 tags (Subscribers → Tags → New Tag): `inkwell-waitlist`, `sqrrledaway-waitlist`, `site-notify`, `contact-form`
4. For each tag, open it and copy the numeric ID from the URL (e.g., `kit.com/subscribers/tags/12345` → tag ID is `12345`)

### 2. Create Discord webhook

1. In any Discord server you control: Server Settings → Integrations → Webhooks → New Webhook
2. Name it "Sqrrlbrain Waitlist" (or similar), pick the channel you want notifications in
3. Copy the webhook URL

### 3. Upgrade Firebase project to Blaze plan

Required for Cloud Functions deployment. Free under the volumes you'll hit (2M function invocations/mo free).

Firebase Console → bottom-left "Spark plan" → "Upgrade to Blaze" → add billing card.

### 4. Wire env vars (one of two ways)

**Option A — Firebase secrets (recommended for production):**
```bash
cd Projects/sqrrlbrain.com
firebase functions:secrets:set KIT_API_KEY
firebase functions:secrets:set KIT_TAG_INKWELL
# ... repeat for each var
```
Then add the secret names to the function's `secrets:` array (see Firebase docs for v2 functions secret binding).

**Option B — `.env` file (simpler for solo dev):**
```bash
cd Projects/sqrrlbrain.com/functions
cp .env.example .env
# Edit .env and fill in real values
```
Note: `.env` should be in `.gitignore` (it is, via the workspace `.env*` pattern).

### 5. Install + deploy

```bash
cd Projects/sqrrlbrain.com
firebase login   # one-time, opens browser
firebase use sqrrlbrain-billing   # if not already aliased

cd functions
npm install
cd ..

firebase deploy --only functions
```

Should output something like:
```
✔  functions[onInkwellWaitlistCreate(us-central1)] Successful create operation.
✔  functions[onSqrrledawayWaitlistCreate(us-central1)] Successful create operation.
✔  functions[onSiteNotifyWaitlistCreate(us-central1)] Successful create operation.
✔  functions[onContactMessageCreate(us-central1)] Successful create operation.
```

---

## Verification

1. Submit a test signup at https://sqrrlbrain.com (e.g., from `/login.html` "Notify me" form)
2. Within 5-10 seconds:
   - Discord channel pings with `[Site notify waitlist] new signup user@example.com`
   - Kit shows the new subscriber under the tagged segment
3. Check function logs: `firebase functions:log`

---

## Updating

When making code changes:
```bash
cd Projects/sqrrlbrain.com
firebase deploy --only functions
```

Function deployment takes ~2 minutes. Existing in-flight signups during deploy aren't lost — Firestore retries the trigger.

---

## Troubleshooting

- **Function deployed but no Discord pings:** check `firebase functions:log` — likely `DISCORD_WEBHOOK_URL` not set or wrong.
- **Kit subscriber created but not tagged:** the corresponding `KIT_TAG_*` env var is missing or has a wrong tag ID.
- **Function fails with "permission denied":** the Blaze plan upgrade hasn't propagated yet, or the service account is missing IAM permissions (rare; usually auto-configured).
- **All four functions show "fail":** check `KIT_API_KEY` is correct (try `curl https://api.kit.com/v4/subscribers -H "X-Kit-Api-Key: $KEY"` from your terminal).

---

## Cost expectations

| Component | Free tier ceiling | Your expected volume |
|---|---|---|
| Firebase Cloud Functions | 2M invocations/mo | <500/mo (50-200 signups + retries) |
| Firebase Cloud Functions | 5GB outbound/mo | <10MB/mo (small JSON payloads) |
| Kit free tier | 10,000 subscribers | <100 in next year |
| Discord webhooks | unlimited free | n/a |

**Realistic monthly cost: $0.** Per the workspace memory `feedback_frugality_first.md`, you'll hit the Blaze plan free tier comfortably.

---

**Workspace context:** [[project_sqrrlbrain]] · [[FIRESTORE-RULES]] · [[CHANGELOG]]
**Tags:** `#proj/sqrrlbrain` `#sys/git` `#type/docs`
