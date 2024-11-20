const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Secret generieren
const secret = speakeasy.generateSecret({ length: 20 });

console.log('Dein geheimer Schlüssel (Base32):', secret.base32);
console.log('Deine OTPAuth URL:', secret.otpauth_url);

// QR-Code für die Google Authenticator App generieren
QRCode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
    if (err) {
        console.error('Fehler beim Generieren des QR-Codes:', err);
        return;
    }

    // QR-Code-Data-URL anzeigen
    console.log('Scanne diesen QR-Code in deiner Google Authenticator App:');
    console.log(dataUrl);
});
