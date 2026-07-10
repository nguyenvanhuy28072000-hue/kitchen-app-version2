//==================================================
// Firebase設定
//==================================================

// Firebaseプロジェクトの情報
const firebaseConfig = {
  apiKey: "AIzaSyAMG0d77v5sxeeJNNlP8QZ-wVys8FUTCSY",
  authDomain: "kitchen-app-version2.firebaseapp.com",
  projectId: "kitchen-app-version2",
  storageBucket: "kitchen-app-version2.firebasestorage.app",
  messagingSenderId: "486197993663",
  appId: "1:486197993663:web:b15a0d343ed6e7916ce60a",
  measurementId: "G-EYVT3M0S9J"
};


//==================================================
// Firebase初期化
//==================================================

// Firebaseを使える状態にする
firebase.initializeApp(firebaseConfig);


//==================================================
// Firestore取得
//==================================================

// Firestore(Database)を使えるようにする
const db = firebase.firestore();


//==================================================
// グローバル公開
//==================================================

// 他のJavaScriptから

// window.db.collection(...)

// のように使えるようにする
window.db = db;


//==================================================
// Authentication取得（任意）
//==================================================

// 今後使う予定があるなら用意しておく
const auth = firebase.auth();

window.auth = auth;