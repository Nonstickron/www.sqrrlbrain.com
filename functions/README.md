# Sqrrlbrain Cloud Functions

Firebase Cloud Functions that trigger on waitlist signups in Firestore and fan out to:
- **Kit (ConvertKit)** — adds subscriber to **one shared newsletter form** (single mailing list). Kit sends the double-opt-in confirmation email automatically.
- **Discord webhook** — posts a real-time notification of every signup.

Both fan-outs gated by env vars. Function deploys safely if either is unset.

## Design — single list, not segmented

All marketing-eligible signups (Inkwell, SqrrledAway, Site notify) push to ONE Kit form. Per Ron's "we'll tout everything we do to anyone who shows interest in anything we are doing" — no per-product segmentation needed at signup time. The Firestore `source` field IS captured into Kit as a custom field, so future segmentation is possible if/when wanted.

**`contact_messages` is intentionally NOT pushed to Kit** — someone sending a support message didn't necessarily opt into a newsletter. Discord-only. Ron can manually add interesting contacts via the Kit dashboard.

## Watched collections

| Firestore collection | → Kit newsletter | → Discord ping | Discord label |
|---|---|---|---|
| `inkwell_waitlist` | ✓ | ✓ | "Inkwell waitlist" |
| `sqrrledaway_waitlist` | ✓ | ✓ | "SqrrledAway waitlist" |
| `site_notify_waitlist` | ✓ | ✓ | "Site notify waitlist (login-page denial)" |
| `contact_messages` | — | ✓ | "Contact form" (includes subject + message preview) |

## Double opt-in flow

Configured at the Kit form level (not in this code):
1. User submits email on sqrrlbrain.com → writes to Firestore
2. Cloud Function posts to Kit form's subscribers endpoint
3. Kit sees the form is configured for double opt-in → sends confirmation email automatically with a link
4. User clicks "Confirm subscription" → Kit moves them to active state
5. They're now eligible for future broadcasts

If the user never clicks confirm, they stay in Kit's "inactive" pool. Discord still pings on the original signup so Ron sees the lead either way.

---

## First-time setup

### 1. Sign up for Kit and configure the newsletter form

1. Sign up at https://kit.com (free, 10K subscribers on free tier)
2. **Account → Settings → Advanced → API → V4 API Key** — copy this
3. **Grow → Landing Pages & Forms → New Form** — create a new form
   - Name: `Sqrrlbrain Studio newsletter` (or your preference)
   - Type: pick a basic style — this form is the *delivery mechanism*, end users won't see it (we POST via API). Style doesn't matter much.
   - **Settings → Incentive Email** — leave the default "Send confirmation email" enabled. This is the double opt-in.
   - **Customize the confirmation email** in Kit's editor: subject + body. Default works; tweak the language to match Sqrrlbrain's voice.
4. Open the form, grab the numeric ID from the URL: `kit.com/forms/12345` → form ID is `12345`
5. (Optional) **Subscribers → Custom Fields → New** — add a field called `source` so the per-collection origin info gets captured per subscriber.

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
