/* Sqrrlbrain shared auth — load AFTER Firebase compat CDN scripts */
const SQRRL_CONFIG = {
  apiKey: "AIzaSyCDf7dzCXackD7j21DQ-BxNVwiMmn5o2ng",
  authDomain: "sqrrlbrain-billing.firebaseapp.com",
  projectId: "sqrrlbrain-billing",
  storageBucket: "sqrrlbrain-billing.firebasestorage.app",
  messagingSenderId: "673586334045",
  appId: "1:673586334045:web:910fcdf3fe60afc88540b4"
};

const SqrrlAuth = (() => {
  let _auth, _db;

  function _init() {
    if (!firebase.apps.length) firebase.initializeApp(SQRRL_CONFIG);
    _auth = firebase.auth();
    _db   = firebase.firestore();
  }

  async function _isApproved(email) {
    try {
      const doc = await _db.collection('approved_users').doc(email).get();
      return doc.exists;
    } catch (_) {
      return false;
    }
  }

  /* Call on any protected page. Redirects to login if not signed in or not approved.
     Hides #sqrrl-gate overlay once access is confirmed. */
  function check() {
    _init();
    _auth.onAuthStateChanged(async user => {
      if (!user) {
        const ret = encodeURIComponent(window.location.href);
        window.location.href = '/login.html?return=' + ret;
        return;
      }
      const ok = await _isApproved(user.email);
      if (!ok) {
        window.location.href = '/login.html?denied=1';
        return;
      }
      const gate = document.getElementById('sqrrl-gate');
      if (gate) gate.remove();
    });
  }

  async function signOut() {
    _init();
    await _auth.signOut();
    window.location.href = '/';
  }

  return { check, signOut };
})();
