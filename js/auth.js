import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { auth, app, db } from './firebase-config.js';

// Remove this line since we're importing db from firebase-config.js
// const db = getFirestore(app);

// Signup functionality
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // Create authentication user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Ensure Firestore is initialized
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                uid: user.uid,
                name: name,
                email: email,
                createdAt: new Date().toISOString(),
                role: 'user',
                isActive: true
            });

            // Wait for a moment to ensure data is written
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Verify the document exists
            const docSnap = await getDoc(userRef);
            if (!docSnap.exists()) {
                throw new Error('Failed to create user document');
            }

            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Signup error:', error);
            alert(error.message);
        }
    });
}

// Login functionality
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Login error:', error);
            alert('Invalid email or password');
        }
    });
}

// Check authentication state
let isRedirecting = false;

onAuthStateChanged(auth, (user) => {
    if (isRedirecting) return;

    const path = window.location.pathname;
    const currentPage = path.split('/').pop() || 'index.html';
    
    const publicPages = ['login.html', 'signup.html', 'index.html'];
    const isPublicPage = publicPages.includes(currentPage);

    try {
        if (user) {
            // User is signed in
            if (isPublicPage && currentPage !== 'index.html') {
                isRedirecting = true;
                window.location.replace('/dashboard.html');
            }
        } else {
            // User is not signed in
            if (!isPublicPage) {
                isRedirecting = true;
                window.location.replace('/login.html');
            }
        }
    } catch (error) {
        console.error('Navigation error:', error);
    }
});

// Also update the form redirects to use absolute paths
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.replace('/dashboard.html');
        } catch (error) {
            console.error('Login error:', error);
            alert('Invalid email or password');
        }
    });
}