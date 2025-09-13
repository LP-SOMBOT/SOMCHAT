// --- CONFIGURATION ---

// ❗️❗️❗️ ACTION REQUIRED ❗️❗️❗️
// 1. DEPLOY YOUR BACKEND (the /server folder) TO RENDER.
// 2. PASTE THE LIVE RENDER URL HERE.
// Your app will show a "Cannot connect" error until you do this.
const BACKEND_URL = "https://your-backend-url.onrender.com"; // <-- REPLACE WITH YOUR DEPLOYED URL

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCPOfXz7NoikD7KmZM4Re0O2RIrdPRadZI",
    authDomain: "somchat-941f3.firebaseapp.com",
    projectId: "somchat-941f3",
    storageBucket: "somchat-941f3.appspot.com",
    messagingSenderId: "528386251362",
    appId: "1:528386251362:web:9fc6f48cf97a82023ccf3b"
};

// --- INITIALIZATION ---
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- STATE ---
let currentUser = null;
let currentChatPartner = null;
let unsubscribeFromMessages = null;

// --- DOM ELEMENTS ---
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const logoutButton = document.getElementById('logout-button');
const usersList = document.getElementById('users-list');
const searchBar = document.getElementById('search-bar');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const chatMessages = document.getElementById('chat-messages');
const chatWithName = document.getElementById('chat-with-name');
const currentUserHeader = document.getElementById('current-user-name');
const errorMessage = document.getElementById('error-message');

// --- AUTHENTICATION LOGIC ---

auth.onAuthStateChanged(user => {
    const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html');
    if (user) {
        currentUser = user;
        if (isAuthPage) window.location.replace('/');
        initializeApp();
    } else {
        currentUser = null;
        if (!isAuthPage) window.location.replace('/login.html');
    }
});

// Signup Handler
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        
        if (errorMessage) errorMessage.textContent = '';
        
        try {
            if (BACKEND_URL.includes("your-backend-url")) {
                throw new Error("Backend URL is not set. Please update the BACKEND_URL in app.js.");
            }
            
            const response = await fetch(`${BACKEND_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'An unknown error occurred.');
            
            await auth.signInWithEmailAndPassword(email, password);
            
        } catch (error) {
            console.error('Signup failed:', error);
            let friendlyMessage = error.message;
            if (error.message.includes('Failed to fetch')) {
                friendlyMessage = 'Cannot connect to the server. Please check the backend URL and CORS settings.';
            }
            if (errorMessage) errorMessage.textContent = friendlyMessage;
        }
    });
}

// Login Handler
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            if (errorMessage) errorMessage.textContent = error.message;
            console.error('Login failed:', error);
        }
    });
}

// Other functions remain the same... (initializeApp, fetchAllUsers, etc.)
// No other changes are needed in the rest of this file.
// The remaining code from the previous response is correct.
if (logoutButton) {
    logoutButton.addEventListener('click', () => auth.signOut());
}

async function initializeApp() {
    if (!currentUser || !document.body.contains(usersList)) return;
    if (currentUserHeader) currentUserHeader.textContent = currentUser.displayName;
    const allUsers = await fetchAllUsers();
    renderUsersList(allUsers);
    if (searchBar) {
        searchBar.addEventListener('keyup', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredUsers = allUsers.filter(user => user.name.toLowerCase().includes(searchTerm));
            renderUsersList(filteredUsers);
        });
    }
    if (messageForm) {
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMessage();
        });
    }
}

async function fetchAllUsers() {
    try {
        const usersCollection = await db.collection('users').get();
        return usersCollection.docs.map(doc => doc.data()).filter(user => user.uid !== currentUser.uid);
    } catch (error) {
        console.error("Error fetching users:", error);
        alert("Could not fetch users. Check Firestore rules and database setup.");
        return [];
    }
}

function renderUsersList(users) {
    if (!usersList) return;
    usersList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user.name;
        li.dataset.uid = user.uid;
        li.dataset.name = user.name;
        li.addEventListener('click', () => {
            if (unsubscribeFromMessages) unsubscribeFromMessages();
            currentChatPartner = user;
            document.querySelectorAll('#users-list li').forEach(item => item.classList.remove('active'));
            li.classList.add('active');
            startChat();
        });
        usersList.appendChild(li);
    });
}

function startChat() {
    chatMessages.innerHTML = '';
    chatWithName.textContent = `Chat with ${currentChatPartner.name}`;
    messageInput.disabled = false;
    sendButton.disabled = false;
    messageInput.focus();
    const chatId = [currentUser.uid, currentChatPartner.uid].sort().join('_');
    const messagesRef = db.collection('chats').doc(chatId).collection('messages').orderBy('timestamp', 'asc');
    unsubscribeFromMessages = messagesRef.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') renderMessage(change.doc.data());
        });
    }, err => {
        console.error("Error listening to messages:", err);
        alert("Error fetching messages. Please check your Firestore security rules.");
    });
}

function sendMessage() {
    const text = messageInput.value.trim();
    if (text === '' || !currentChatPartner) return;
    const chatId = [currentUser.uid, currentChatPartner.uid].sort().join('_');
    const messagesRef = db.collection('chats').doc(chatId).collection('messages');
    messagesRef.add({
        text,
        senderId: currentUser.uid,
        receiverId: currentChatPartner.uid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    messageInput.value = '';
}

function renderMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', message.senderId === currentUser.uid ? 'sent' : 'received');
    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble');
    bubble.textContent = message.text;
    const timestamp = document.createElement('div');
    timestamp.classList.add('timestamp');
    const date = message.timestamp ? message.timestamp.toDate() : new Date();
    timestamp.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageDiv.appendChild(bubble);
    messageDiv.appendChild(timestamp);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (window.location.pathname === '/') {
    initializeApp();
}
