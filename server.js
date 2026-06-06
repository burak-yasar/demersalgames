const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET;

if (!RECAPTCHA_SECRET) {
    console.error('Missing RECAPTCHA_SECRET in environment. Create a .env file with RECAPTCHA_SECRET=your_secret_key');
    process.exit(1);
}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/contact', async (req, res) => {
    const { name, email, message, recaptchaToken } = req.body;

    if (!name || !email || !message || !recaptchaToken) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    try {
        const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
        const params = new URLSearchParams();
        params.append('secret', RECAPTCHA_SECRET);
        params.append('response', recaptchaToken);

        const verifyResponse = await fetch(verifyUrl, {
            method: 'POST',
            body: params
        });

        const verification = await verifyResponse.json();

        if (!verification.success || verification.score < 0.5 || verification.action !== 'contact') {
            return res.status(400).json({ success: false, message: 'reCAPTCHA validation failed.' });
        }

        // TODO: Replace this with your actual message handling logic.
        // Example: send an email, save to a database, or forward to a CRM.
        console.log('Valid contact request:', {
            name,
            email,
            message,
            score: verification.score,
            action: verification.action
        });

        return res.json({ success: true });
    } catch (error) {
        console.error('Error verifying reCAPTCHA:', error);
        return res.status(500).json({ success: false, message: 'Server error verifying reCAPTCHA.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
