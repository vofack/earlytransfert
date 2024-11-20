importScripts('https://www.gstatic.com/firebasejs/7.7.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.7.0/firebase-messaging.js');
firebase.initializeApp({
    apiKey: "AIzaSyCHus9wv4ZgmqvxbGYFI0ZyGD6qO2knSBM",
    authDomain: "dashboard-33d8e.firebaseapp.com",
    databaseURL: "https://dashboard-33d8e-default-rtdb.firebaseio.com",
    projectId: "dashboard-33d8e",
    storageBucket: "dashboard-33d8e.appspot.com",
    messagingSenderId: "82198380910",
    appId: "1:82198380910:web:55ea48f2a281b88a4b817f"
});
const messaging = firebase.messaging();