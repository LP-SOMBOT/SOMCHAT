const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// --- SETUP ---
const app = express();

// --- CORS CONFIGURATION ---
// This allows your frontend (from any origin) to make requests to this backend.
// For production, you might want to restrict this to your Firebase Hosting URL.
// Example: const corsOptions = { origin: 'https://somchat-941f3.web.app' }
app.use(cors());

app.use(express.json());

// Initialize Firebase Admin
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error("Error initializing Firebase Admin SDK. Make sure serviceAccountKey.json is present in the /server directory.", error);
  process.exit(1);
}

// --- ROUTES ---
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Add a root route to check if the server is running
app.get('/', (req, res) => {
  res.send('SOMCHAT Backend is running!');
});

// --- START SERVER ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
