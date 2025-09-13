# SOMCHAT Setup Guide

## 1. Backend Deployment (Render)

1.  **Get Firebase Credentials:**
    - Go to your Firebase Project Settings > Service accounts.
    - Click "Generate new private key".
    - Rename the downloaded file to `serviceAccountKey.json` and place it inside the `/server` directory.

2.  **Push to GitHub:** Create a new repository on GitHub and push your entire project to it.

3.  **Deploy on Render:**
    - Create a new **Web Service** on Render and connect your GitHub repo.
    - Set **Root Directory**: `server`
    - Set **Build Command**: `npm install`
    - Set **Start Command**: `npm start`
    - After deploying, **copy your live Render URL**. It will look like `https://your-app-name.onrender.com`.

## 2. Frontend Configuration & Deployment (Firebase)

1.  **Update Backend URL:**
    - Open `public/app.js`.
    - Find the `BACKEND_URL` constant and **paste your live Render URL**. This is the most important step to fix connection errors.

2.  **Deploy Firebase Rules:**
    - In your project's root directory, run this command:
    ```bash
    firebase deploy --only firestore:rules
    ```
    - **The app will not work without this.**

3.  **Deploy Frontend:**
    - Run the hosting deploy command:
    ```bash
    firebase deploy --only hosting
    ```

Your app is now live and fully configured!
