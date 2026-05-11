# Wyrdspinner Waitlist — Firestore Setup

The Wyrdspinner teaser page at `/wyrdspinner.html` collects launch-notification signups into Firestore. Each submission becomes one document in the `inkwell_waitlist` collection (collection name preserved from the pre-rebrand schema for data continuity — see [[project_wyrdspinner]] for rename history).

## Required: deploy this Firestore rule

Replace your current Firestore rules with this version (adds the `inkwell_waitlist` block; keeps existing rules intact). In Firebase Console → Firestore Database → Rules → paste → Publish.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /site_approved_users/{email} {
      allow read: if request.auth != null && request.auth.token.email == email;
    }

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

    // Wyrdspinner launch waitlist — public create only, validated, no read
    match /inkwell_waitlist/{docId} {
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

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Verifying

1. Deploy the rule (above).
2. Open `/wyrdspinner.html`. Submit your email through the waitlist form.
3. In Firebase Console → Firestore Data → `inkwell_waitlist` → confirm a new doc appeared with fields `email`, `source: "inkwell_teaser"`, `created_at`, `user_agent`, `page_referrer`.
4. Open the form again from the same browser. Try submitting a second time within a minute — the client-side rate limit message ("You're already on the list") should appear without a new Firestore write.
5. Try submitting an obviously invalid email (e.g. `not-an-email`). The form should reject it client-side; if you bypass the client check, the Firestore rule will reject it server-side with `permission-denied`.

## Document shape

| Field | Type | Notes |
|---|---|---|
| `email` | string | Validated against `^[^@\s]+@[^@\s]+\.[^@\s]+$`. Max 200. |
| `source` | string | Always `"inkwell_teaser"` from this page. Reserved so future channels (App Store, social, etc.) can be tagged separately. Max 64. |
| `created_at` | Timestamp | `serverTimestamp()` set by Firestore at write. |
| `user_agent` | string | First 500 chars of `navigator.userAgent`. |
| `page_referrer` | string | First 500 chars of `document.referrer`. |

No other fields are allowed by the rule.

## Reading the list

Reads are forbidden by the security rule (`allow read: if false`), so the list cannot be enumerated by visitors. To view signups:

- **Firebase Console** → Firestore Data → `inkwell_waitlist` (manual review during the early/quiet phase)
- **Export to CSV**: Firebase Console export → Cloud Storage → download → spreadsheet
- **Programmatic read**: future option, requires either an authenticated read rule for an admin email, or a Cloud Function with admin SDK. Skip until volume justifies.

## When TestFlight is ready

When you're ready to send launch invitations:

1. Export `inkwell_waitlist` from Firebase Console.
2. Either: add each email as a TestFlight tester through App Store Connect, or send a launch-day email through your sender of choice with the TestFlight public link.
3. Optionally: archive submissions older than the launch date by exporting + deleting, or leave them as a record.

## Cost estimate

Personal/early-stage volume is well under Firestore's free tier (20K writes/day). Each submission is one write. No reads happen from the public side.

## If something goes wrong

- **`permission-denied` errors in console** → the rule above hasn't been deployed yet. Deploy it.
- **Form says "Something went wrong"** → open DevTools console; check whether the error is `permission-denied` (rule not deployed or email failed validation) or a network failure.
- **Want to test without polluting the real list** → submit, then go to Firestore Console → delete the test doc.


---

**Workspace context:** [[project_wyrdspinner]] · [[project_sqrrlbrain]] · [[feedback_firestore_rules_audit_first]]
**Tags:** `#proj/wyrdspinner` `#proj/sqrrlbrain` `#type/docs`

> Filename note: this doc was previously `INKWELL-WAITLIST-SETUP.md`. Renamed 2026-05-10/11 as part of the Inkwell → Wyrdspinner rebrand.
