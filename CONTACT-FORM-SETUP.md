# Contact form — Firebase setup

The contact form on `/contact.html` writes submissions to a Firestore collection called `contact_messages`. **Until you deploy the security rules below, every submission will fail with a permission-denied error.** The form's UI handles the failure gracefully (shows the user a "please email directly" fallback message), but no messages will be saved.

---

## Step 1 — Update Firestore security rules

1. Open the Firebase Console: <https://console.firebase.google.com/project/sqrrlbrain-billing/firestore/rules>
2. Replace the entire rules block with this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Approved-user lookup (auth-gated reads only)
    match /site_approved_users/{email} {
      allow read: if request.auth != null && request.auth.token.email == email;
    }

    // Contact form submissions — anonymous create only, validated
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

    // Default deny — preserves existing lockdown
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **Publish**.

The `allow read, update, delete: if false` line means messages cannot be read by anyone client-side. To read submissions, use the Firebase Console (which uses admin credentials and bypasses these rules).

---

## Step 2 — Reading submissions

During Apple's review window, check daily:

<https://console.firebase.google.com/project/sqrrlbrain-billing/firestore/data/~2Fcontact_messages>

Each document will show: name, email, subject, message, timestamp, user agent, referrer. Reply via Gmail to the email address provided.

---

## Step 3 (later) — Email forwarding

For automatic email notifications when a message arrives, you have two paths:

**Option A — Firebase Trigger Email extension (recommended long-term).**
Requires upgrading Firebase to the **Blaze plan** (pay-as-you-go, but free for the volume you'll see). Then install the Trigger Email extension and configure it with your Gmail SMTP credentials (using a Gmail App Password, not your account password). Submissions auto-forward to `sqrrlbrain@gmail.com`.

**Option B — Manual checking only.**
Skip the extension and just check the Firestore Console daily. Fine for low-volume use; risky during Apple review since they may test the form and expect a reply.

For this week (Apple resubmission), Option B is fine if you're disciplined about checking. If review takes longer than a week, switch to Option A.

---

## Verification

After deploying the rules, test the form yourself:

1. Visit `https://sqrrlbrain.com/contact.html` in a private/incognito window (no Firebase auth).
2. Submit a test message.
3. Confirm the success message appears on screen.
4. Check the Firebase Console — your test message should be in `contact_messages`.

If submission fails, the most likely cause is that the rules above weren't published. Check the browser console for the specific error.
