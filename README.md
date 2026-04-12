# Finance1

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.1.6.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).


####git hub info 

git init
git add .
git commit -m"mesage"
//Click this link to generate
https://github.com/settings/tokens  ( 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 )
git remote set-url origin https://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@github.com/vofack/earlytransfert.git
and while cloning
git clone https://<username>:<githubtoken>@github.com/<username>/<repositoryname>.git
git push --set-upstream origin master

- install nvm on local directory : curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
- nvm install v18.20.4    

- ericanicetkwuningvofack@Erics-MacBook-Pro earlytransfert % firebase logout                              
- ericanicetkwuningvofack@Erics-MacBook-Pro earlytransfert % nvm use v18.20.4    
- npm i 
- npm install -g firebase-tools@13.22.1                        
- ericanicetkwuningvofack@Erics-MacBook-Pro earlytransfert % firebase login      
- ericanicetkwuningvofack@Erics-MacBook-Pro earlytransfert % export NODE_OPTIONS=--openssl-legacy-provider  
- npm install -g @angular/cli@16
- ng serve --open --configuration=fr   
- ericanicetkwuningvofack@Erics-MacBook-Pro earlytransfert % ng build      
- ericanicetkwuningvofack@Erics-MacBook-Pro earlytransfert % firebase deploy  

npm uninstall firebase @angular/fire --legacy-peer-deps
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps

npm uninstall firebase @angular/fire
npm uninstall firebase @angular/fire --legacy-peer-deps
npm install @angular/fire@6.1.5 firebase@8.10.1 --legacy-peer-deps

ng build
firebase deploy --only hosting:earlytransfert



<!-- 
npm install firebase

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzJh0WcQo14hMB149ajVKtNKS8DZK88OA",
  authDomain: "dashboard-33d8e.firebaseapp.com",
  databaseURL: "https://dashboard-33d8e-default-rtdb.firebaseio.com",
  projectId: "dashboard-33d8e",
  storageBucket: "dashboard-33d8e.firebasestorage.app",
  messagingSenderId: "82198380910",
  appId: "1:82198380910:web:af7fe3d73b2bc9e84b817f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

npm install -g firebase-tools
firebase login
firebase init

{
  "hosting": {
    "site": "earlytransfert",

    "public": "public",
    ...
  }
}

firebase deploy --only hosting:earlytransfert -->

cd functions && npm install

# Configure with YOUR email provider's IMAP settings:
firebase functions:config:set \
  email.user="earlytransfert@gmail.com" \
  email.password="wirq nvws vquj olme" \
  email.host="imap.gmail.com" \
  email.port="993"

firebase deploy --only functions

When you switch to a professional email, just update the config:

firebase functions:config:set \
  email.user="contact@yourdomain.com" \
  email.password="your-password" \
  email.host="imap.yourhostprovider.com" \
  email.port="993"

firebase deploy --only functions
No code changes needed — just swap the credentials and IMAP host.

For Gmail specifically: you'll need to generate an App Password (Google Account → Security → 2-Step Verification → App passwords) since Google blocks plain password IMAP login.
 
firebase functions:secrets:set EMAIL_USER
firebase functions:secrets:set EMAIL_PASSWORD
firebase functions:secrets:set EMAIL_HOST
firebase functions:secrets:set EMAIL_PORT


All tasks are complete. Here's a summary of everything implemented:

Firebase Cloud Messaging Implementation
Flutter App (earlyTransfertFlutter)
pubspec.yaml - Added firebase_messaging: ^14.7.10 dependency

lib/services/fcm_service.dart - New FCM service that:

Requests notification permissions (iOS + Android 13+)
Handles foreground messages (shows as local notifications)
Handles background messages via top-level handler
Retrieves and saves FCM tokens to Firestore (users/{doc}.fcmToken)
Auto-refreshes tokens when they change
lib/main.dart - Initializes FCM on app startup

lib/controllers/auth/signin_controller.dart - Saves FCM token after: email sign-in, sign-in after sign-up, Google sign-in, and Face ID sign-in

lib/controllers/auth/signup_controller.dart - Saves FCM token after account creation

Cloud Function (functions/)
functions/index.js - New sendNotification HTTP function that:
Accepts title, body, targetEmail via POST
Sends to a specific user (by email) or all users with FCM tokens
Uses admin.messaging().sendEachForMulticast() for delivery
Logs every notification to notifications Firestore collection
Angular Admin (earlytransfert)
src/app/models/push-notification.ts - PushNotification interface

src/app/services/data.service.ts - Added getAllNotifications() and getAllUsers() methods

manage-transactions.component.html - New Notifications tab with:

Send form: title, message, target (all users / specific user dropdown)
Notification history ag-Grid table
manage-transactions.component.ts - Notification tab logic: send via Cloud Function, load history, load user list for targeting

Before deploying, you need to:
Flutter: Run flutter pub get in the Flutter project
Cloud Function: Run firebase deploy --only functions from the Angular project root
Angular: The admin app will work once the Cloud Function is deployed


https://email.ionos.com/appsuite/#!!&app=io.ox/mail&folder=default0/INBOX
earlytransfert.com
oltz jkyb abwh dfcp

firebase functions:secrets:set EMAIL_HOST   # enter: imap.ionos.com
firebase functions:secrets:set EMAIL_PORT   # enter: 993
firebase functions:secrets:set EMAIL_USER   # enter: info@earlytransfert.com
firebase functions:secrets:set EMAIL_PASSWORD   # enter: Jesussauveur@26


EMAIL_USER=info@earlytransfert.com
EMAIL_PASSWORD=Jesussauveur@26


pour les fonctions utilisant ionos comme eamil (jai juste change les config dans en.local pour le le local) pis pour le prod jai fait :
firebase functions:secrets:set EMAIL_HOST   # enter: imap.ionos.com
firebase functions:secrets:set EMAIL_PORT   # enter: 993
firebase functions:secrets:set EMAIL_USER   # enter: info@earlytransfert.com
firebase functions:secrets:set EMAIL_PASSWORD   # enter: Jesussauveur@26

NB: pas besoin de password apps(with 2 step verifiction) comme avec gmail on utilise le mp tel que

https://claude.ai/share/07918f22-1f58-4486-881f-d481e0d88e65