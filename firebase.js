//==================================================
// Firebase設定
//==================================================

// Firebaseプロジェクトの情報
const firebaseConfig = {

    apiKey: "AIzaSyBzlvVUxZrMaU8OxYve9GNts1ZdCz35CWk",

    authDomain: "kitchen-app-31fa9.firebaseapp.com",

    projectId: "kitchen-app-31fa9",

    storageBucket: "kitchen-app-31fa9.firebasestorage.app",

    messagingSenderId: "18408555856",

    appId: "1:18408555856:web:b4a4337326d408f5f5d855"

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