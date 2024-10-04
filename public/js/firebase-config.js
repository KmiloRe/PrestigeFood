import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCC5wFgpdCjg0bZXtde9DeMGb8CEyZbiJg",
  authDomain: "prestigefood-c6185.firebaseapp.com",
  projectId: "prestigefood-c6185",
  storageBucket: "prestigefood-c6185.appspot.com",
  messagingSenderId: "656682601809",
  appId: "1:656682601809:web:c65f3d36cadcd45f2e5770"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase(app);

export { auth, database };

window.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;

            try {
                const response = await fetch('http://localhost:3000/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await response.json();
                if (data.success) {
                    alert('Usuario Registrado Exitosamente');
                    window.location.href = 'login.html'; // Redirige al login.html
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                alert('El usuario ha iniciado sesión correctamente');
                window.location.href = 'index.html'; // Redirige al index.html
            } catch (error) {
                console.error('Error:', error);
                if (error.code === 'auth/user-not-found') {
                    alert('User not found');
                } else if (error.code === 'auth/wrong-password') {
                    alert('Incorrect password');
                } else {
                    alert('Error logging in: ' + error.message);
                }
            }
        });
    }

    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault(); // Evita el comportamiento predeterminado del enlace
            try {
                await signOut(auth);
                alert('Has cerrado sesión exitosamente'); // Mensaje de alerta al cerrar sesión
                window.location.href = ''; 
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                alert('Error al cerrar sesión: ' + error.message);
            }
        });
    }
});

