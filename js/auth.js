import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getFirestore, doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { auth, app } from './firebase-config.js';

const db = getFirestore(app);

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
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('signup.html')) {
            window.location.href = 'dashboard.html';
        }
    } else {
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'login.html';
        }
    }
});