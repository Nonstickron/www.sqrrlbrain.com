# Firestore Rules — Canonical (deploy this)

**Single source of truth for the `sqrrlbrain-billing` Firebase project's Firestore rules.** The repo's `firestore.rules` file is what actually deploys (`firebase deploy --only firestore:rules`); this doc mirrors it for review + history. Keep the two in sync — when adding a rule, update both.

> **Resynced 2026-06-02:** this doc had drifted behind `firestore.rules` (it still showed `inkwell_waitlist` as a public waitlist, and was missing the `inkwell→wyrdspinner` rename + the locked legacy block + `site_notify_waitlist`). Reconciled to match the deployed file, and the new **`households` budget rule** added (see below).

## Deploy

`firebase deploy --only firestore:rules` from the repo root (deploys `firestore.rules`). Or paste the block below into Firebase Console → Firestore Database → Rules → Publish. Both must match the file.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Approved-users gate (used by login.html, dashboard.html, crucible.html)
    match /site_approved_users/{email} {
      allow read: if request.auth != null && request.auth.token.email == email;
    }

    // Public contact form — create-only, validated, no read
    match /contact_messages/{docId} {
      allow create: if request.resource.data.keys().hasOnly([
                      'name','email','subject','message',
                      'created_at','user_agent','page_referrer'
                    ])
                    && request.resource.data.name is string
                    && request.resource.data.name.size() > 0
                    && request.resource.data.name.size() <= 100
                    && request.resource.data.email is string
                    && request.resource.data.email.size() > 0
                    && request.resource.data.email.size() <= 200
                    && request.resource.data.message is string
                    && request.resource.data.message.size() > 0
                    && request.resource.data.message.size() <= 5000
                    && (request.resource.data.subject == null
                        || (request.resource.data.subject is string
                            && request.resource.data.subject.size() <= 200));
      allow read, update, delete: if false;
    }

    // Per-user dashboard state — read/write only by the owner, gated by approval list
    match /dashboard_state/{email} {
      allow read, write: if request.auth != null
                         && request.auth.token.email == email
                         && exists(/databases/$(database)/documents/site_approved_users/$(email));
    }

    // Wyrdspinner launch waitlist — public create only, validated, no read.
    // (Formerly inkwell_waitlist; renamed 2026-05-11 to match the rebrand.
    // Old collection still exists with locked-down rules below for archival.)
    match /wyrdspinner_waitlist/{docId} {
      allow create: if request.resource.data.keys().hasOnly([
                      'email','source','created_at','user_agent','page_referrer'
                    ])
                    && request.resource.data.email is string
                    && request.resource.data.email.size() > 0
                    && request.resource.data.email.size() <= 200
                    && request.resource.data.email.matches('^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$')
                    && request.resource.data.source is string
                    && request.resource.data.source.size() <= 64;
      allow read, update, delete: if false;
    }

    // inkwell_waitlist (legacy, pre-rebrand) — fully locked. Data preserved
    // for archive; no new writes accepted, no reads, no modifications.
    match /inkwell_waitlist/{docId} {
      allow read, create, update, delete: if false;
    }

    // SqrrledAway launch waitlist — public create only, validated, no read
    match /sqrrledaway_waitlist/{docId} {
      allow create: if request.resource.data.keys().hasOnly([
                      'email','source','created_at','user_agent','page_referrer'
                    ])
                    && request.resource.data.email is string
                    && request.resource.data.email.size() > 0
                    && request.resource.data.email.size() <= 200
                    && request.resource.data.email.matches('^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$')
                    && request.resource.data.source is string
                    && request.resource.data.source.size() <= 64;
      allow read, update, delete: if false;
    }

    // Site-wide notify-when-public waitlist — fires from login.html when a user
    // hits a gated area without approval. Public create only, validated, no read.
    match /site_notify_waitlist/{docId} {
      allow create: if request.resource.data.keys().hasOnly([
                      'email','source','created_at','user_agent','page_referrer'
                    ])
                    && request.resource.data.email is string
                    && request.resource.data.email.size() > 0
                    && request.resource.data.email.size() <= 200
                    && request.resource.data.email.matches('^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$')
                    && request.resource.data.source is string
                    && request.resource.data.source.size() <= 64;
      allow read, update, delete: if false;
    }

    // Per-user app data — read/write only by the user themselves.
    // Used by sqrrlbrain-billing.html (settings, clients, jobs, expenses)
    // and any future per-user-scoped app.
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Household budget — the FIRST shared-by-two-people doc (every rule above is single-owner).
    // Shared by exactly Ronny + Dauvy; locked to their two UIDs (non-PII, unlike emails).
    // TODO(activation): replace the two placeholder UIDs after both sign in once (see budget
    // ACTIVATION.md), then deploy. Until the real UIDs are filled this matches nobody (safe).
    match /households/{hid} {
      allow read, write: if request.auth != null
        && request.auth.uid in [
          "__RONNY_UID__",   // Ronny's account
          "__DAUVY_UID__"    // Dauvy's account
        ];
    }

    // Default deny — anything not matched above is forbidden
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Household budget rule (added 2026-06-02)

The `households/{hid}` block is the first **shared-by-two-people** doc in the ruleset — every other rule is single-owner (`email==email` or `uid==uid`). It's locked to Ronny's + Dauvy's two Firebase `auth.uid`s (UIDs, not emails — keeps PII out of the repo).

**Activation (per `Projects/budgetting/ACTIVATION.md`):** after both sign in once at the deployed, gated budget page, replace `__RONNY_UID__` / `__DAUVY_UID__` with their real UIDs and redeploy. Until the placeholders are filled it matches nobody, so deploying it early is safe (default-deny applies).

## What broke and why the per-user rule is needed

The `sqrrlbrain-billing.html` app stores all its data under `users/<currentUser.uid>/...`:

- `users/<uid>/meta/settings` — your business profile, rates, terms, next invoice number
- `users/<uid>/meta/clients` — client list
- `users/<uid>/jobs/<jobId>` — invoices/jobs
- `users/<uid>/expenses/<expenseId>` — expense log

When the dashboard sync + waitlist rules were deployed, the catch-all `match /{document=**} { allow read, write: if false; }` started rejecting every billing read because no rule explicitly allowed `/users/{uid}/...`. The billing app's `loadAll()` await silently failed, leaving the page stuck on the "initializing" spinner. The `/users/{userId}/{document=**}` block gates per-user data behind a uid match — only the signed-in user can read/write their own subtree.

## Future rules

If a new app needs Firestore access, add its rule block to `firestore.rules` (above the catch-all), mirror it here, keep the two in sync, and deploy via `firebase deploy --only firestore:rules`.

---

**Workspace context:** [[feedback_firestore_rules_audit_first]] · [[project_sqrrlbrain]]
**Tags:** `#proj/sqrrlbrain` `#sys/git` `#type/docs`
