importScripts('https://www.gstatic.com/firebasejs/7.7.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.7.0/firebase-messaging.js');
firebase.initializeApp({
    apiKey: "AIzaSyCzJh0WcQo14hMB149ajVKtNKS8DZK88OA",
    authDomain: "dashboard-33d8e.firebaseapp.com",
    databaseURL: "https://dashboard-33d8e-default-rtdb.firebaseio.com",
    projectId: "dashboard-33d8e",
    storageBucket: "dashboard-33d8e.firebasestorage.app",
    messagingSenderId: "82198380910",
    appId: "1:82198380910:web:af7fe3d73b2bc9e84b817f"
});
const messaging = firebase.messaging();