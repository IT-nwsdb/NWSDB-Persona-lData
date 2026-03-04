Personal File Details (Firestore Version)

This website now saves/loads records from Firebase Firestore in real-time.

1) Firestore setup
- Firebase Console -> Build -> Firestore Database -> Create database.
- Make sure Firestore rules allow the app to read/write.

  IMPORTANT (security): If you deploy publicly, do NOT leave Firestore open.
  Add Firebase Authentication and restrict rules to authenticated users.

  For quick local testing only, you can temporarily use open rules:

  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if true;
      }
    }
  }

2) Hosting / running locally
Because this site uses ES Modules (type="module"), you should open it through a web server.

- If you have Node.js:
  npx serve
  (then open the shown http://localhost URL)

- Or use VS Code "Live Server" extension.

3) Firestore collections
The app creates/uses these collections automatically:
- staff_list
- transfers
- retired
- contract
- lrdc
- cleaning_service
- trainee


4) Migrating old localStorage data
If you used the older version of this site, any existing localStorage data will be copied to
Firestore once on first load, and a flag will be stored in localStorage:
  pfd_migrated_to_firestore_v1



NOTE: This build uses Firebase 'compat' scripts so it also works when opened via file://, but it's still best to serve it over http(s).
