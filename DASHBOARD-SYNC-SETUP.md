# Dashboard Cross-Device Sync — Firestore Setup

The Mission Control dashboard at `/dashboard.html` syncs notes, chore Done states, household custom projects, and the shopping list across devices via Firestore. Each user gets one document at `dashboard_state/<email>` containing all their state.

## Required: deploy this Firestore rule

Replace your current Firestore rules with this version (adds the `dashboard_state` block; keeps existing rules intact). In Firebase Console → Firestore Database → Rules → paste → Publish.

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

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Verifying

1. Deploy the rule (above).
2. Open the dashboard. Add a household project via **+ Add Project**, type a note in any card, check a shopping-list item.
3. In Firebase Console → Firestore Data → `dashboard_state` → click the doc with your email. Confirm it has `notes`, `chores`, `household_custom`, `shopping`, and `updatedAt` fields.
4. On a second device (or a different browser signed in to the same account), open the dashboard. The new project, the note, and the checked shopping item should be there.
5. Switch tabs away and back. The dashboard re-pulls on focus, so changes from another device land within ~1s of refocus.

## How it works

- **Sync model:** pull-on-load + push-on-change.
  - On first auth confirmation, the dashboard fetches `dashboard_state/<email>` and hydrates localStorage from the doc.
  - Every change to a tracked localStorage key triggers a debounced (1.5s) full-doc write to Firestore.
  - When the tab regains focus (`visibilitychange`), it re-pulls.
- **Source of truth:** Firestore. localStorage is a local cache for snappy UI.
- **Conflict resolution:** last-write-wins per debounce window. If you make rapid changes across two devices simultaneously, one set of changes wins (acceptable for personal-use single-user data).

## Tracked keys

| localStorage key | Firestore field |
|---|---|
| `notes_<projectId>` (any project) | `notes.<projectId>` |
| `chore_state_<choreId>` | `chores.<choreId>` |
| `sqrrl-dashboard-household-custom` | `household_custom` (array) |
| `sqrrl-dashboard-shopping` | `shopping` (array) |

Other localStorage keys (e.g. Firebase auth state) are passed through unchanged and not synced.

## Cost estimate

Personal use is well under Firestore's free tier (20K writes/day, 50K reads/day). Typical session: 1 read on load + a handful of writes (debounced). Monthly cost: <<$0.01.

## If something goes wrong

- **Permission-denied errors in console** → the rule above hasn't been deployed yet. Deploy it.
- **Sync feels stuck** → check Firebase Console → Firestore → `dashboard_state/<your email>` for the latest `updatedAt`. If it's stale, check console for write errors.
- **Want to wipe and start over** → delete the `dashboard_state/<your email>` doc in Firebase Console, then refresh the dashboard. localStorage on each device still has its own copy; refresh re-pulls (which is now empty), so you'll want to also `localStorage.clear()` in DevTools on each device.


---

**Workspace context:** [[project_dashboard_notes_localstorage]] · [[project_sqrrlbrain]] · [[feedback_firestore_rules_audit_first]]
**Tags:** `#proj/sqrrlbrain` `#type/docs`
