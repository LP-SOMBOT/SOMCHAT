const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

// API Endpoint for User Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).send({ error: 'Name, email, and password are required.' });
        }

        // 1. Create user in Firebase Authentication
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: name
        });

        // 2. Add user details to the 'users' collection in Firestore
        // This makes the user discoverable by others in the app
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            name: name,
            email: email,
        });

        res.status(201).send({ message: 'User created successfully', uid: userRecord.uid });
    } catch (error) {
        console.error("Error during signup:", error);
        // Provide a more user-friendly error message
        const errorMessage = error.code === 'auth/email-already-exists' 
            ? 'The email address is already in use by another account.' 
            : 'An error occurred during signup.';
        res.status(400).send({ error: errorMessage });
    }
});

module.exports = router;
