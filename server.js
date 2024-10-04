const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const admin = require('firebase-admin');
const twilio = require('twilio');
const bodyParser = require('body-parser');

// Asegúrate de que la ruta al archivo de clave de servicio es correcta
const serviceAccount = require('./serviceAccountKey.json');

// Inicializa Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://prestigefood-c6185.firebaseio.com"
});

// Inicializa Twilio
const accountSid = '';
const authToken = '';
const client = twilio(accountSid, authToken);

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint para registro
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: name
        });

        // Guarda el usuario en Firestore
        await admin.firestore().collection('users').doc(userRecord.uid).set({
            name: name,
            email: email, 
            password: password
        });

        res.json({ success: true, message: 'Usuario registrado Exitosamente' });
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        res.status(500).json({ success: false, message: 'Error al registrar el usuario', error: error.message });
    }
});

// Endpoint para verificar existencia de usuario
app.post('/login', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await admin.auth().getUserByEmail(email);

        // Verifica si el usuario existe en Firestore
        const userDoc = await admin.firestore().collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'User found', user: userDoc.data() });
    } catch (error) {
        console.error('Error finding user:', error);
        res.status(500).json({ success: false, message: 'Error finding user', error: error.message });
    }
});

// Endpoint para enviar código de verificación por SMS
app.post('/send-code', (req, res) => {
    const { phoneNumber, code } = req.body;

    client.messages.create({
        body: `Su código de verificación es ${code}`,
        from: '+12082161546', // Número de teléfono Twilio válido para enviar SMS
        to: phoneNumber
    })
    .then(message => {
        res.send({ success: true, messageSid: message.sid });
    })
    .catch(error => {
        console.error('Error al enviar el mensaje:', error); // Añade un log de error
        res.status(500).send({ success: false, error });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`El servidor esta corriendo en el puerto: ${PORT}`);
});
