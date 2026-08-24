import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'node:fs';

dotenv.config();

const logoBase64 = fs.readFileSync(
  new URL('../public/logo.png', import.meta.url)
).toString('base64');

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const buildTransferEmail = ({
  firstName,
  lastName,
  iban,
  swift,
  bankCode,
  amount,
  label,
  executionDate,
  reference
}) => {
  const safeFirstName = escapeHtml(firstName);
  const safeLastName = escapeHtml(lastName);
  const safeIban = escapeHtml(iban);
  const safeSwift = escapeHtml(swift);
  const safeBankCode = escapeHtml(bankCode);
  const safeLabel = escapeHtml(label || 'VIREMENT');
  const safeAmount = escapeHtml(amount);
  const safeDate = escapeHtml(executionDate);
  const safeReference = escapeHtml(reference);
  const logoCid = 'bnp-logo-confirmation@bnpp';

  return `
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de virement</title>
</head>
<body style="margin:0;padding:0;background:#f3f7f5;font-family:Arial,Helvetica,sans-serif;color:#17352e;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Votre virement a été enregistré avec succès. Référence ${safeReference}.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f7f5;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(15,76,67,.10);">
          <tr>
            <td style="height:6px;background:#10b981;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:30px 34px 22px;text-align:center;">
              <img src="cid:${logoCid}" width="190" alt="BNP Paribas" style="display:block;width:190px;max-width:80%;height:auto;margin:0 auto 24px;border:0;">
              <div style="display:inline-block;padding:7px 13px;border-radius:999px;background:#e8f8f1;color:#087f5b;font-size:12px;font-weight:bold;letter-spacing:.4px;text-transform:uppercase;">Virement confirmé</div>
              <h1 style="margin:16px 0 8px;color:#123c32;font-size:27px;line-height:1.2;font-weight:700;">Votre virement a été enregistré</h1>
              <p style="margin:0;color:#6b7f79;font-size:14px;line-height:1.6;">Merci de conserver cet e-mail comme justificatif.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 34px;">
              <div style="height:1px;background:#e7efeb;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 34px 8px;">
              <p style="margin:0 0 8px;color:#6b7f79;font-size:14px;">Bonjour <strong style="color:#17352e;">${safeFirstName} ${safeLastName}</strong>,</p>
              <p style="margin:0;color:#536b64;font-size:14px;line-height:1.7;">Nous vous confirmons l’exécution de votre virement avec les informations suivantes.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 34px 12px;">
              <div style="background:#f0fbf6;border:1px solid #ccefe0;border-radius:16px;padding:22px;text-align:center;">
                <div style="color:#6b7f79;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">Montant du virement</div>
                <div style="margin-top:8px;color:#087f5b;font-size:36px;line-height:1.1;font-weight:700;">${safeAmount} €</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 34px 26px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e4ece8;border-radius:14px;overflow:hidden;">
                <tr><td style="padding:13px 16px;background:#fbfdfc;color:#72847e;font-size:13px;width:38%;">Référence</td><td style="padding:13px 16px;background:#fbfdfc;color:#17352e;font-size:13px;font-weight:bold;text-align:right;word-break:break-all;">${safeReference}</td></tr>
                <tr><td style="padding:13px 16px;color:#72847e;font-size:13px;border-top:1px solid #e4ece8;">Date</td><td style="padding:13px 16px;color:#17352e;font-size:13px;text-align:right;border-top:1px solid #e4ece8;">${safeDate}</td></tr>
                <tr><td style="padding:13px 16px;background:#fbfdfc;color:#72847e;font-size:13px;border-top:1px solid #e4ece8;">Bénéficiaire</td><td style="padding:13px 16px;background:#fbfdfc;color:#17352e;font-size:13px;font-weight:bold;text-align:right;border-top:1px solid #e4ece8;">${safeFirstName} ${safeLastName}</td></tr>
                <tr><td style="padding:13px 16px;color:#72847e;font-size:13px;border-top:1px solid #e4ece8;">IBAN</td><td style="padding:13px 16px;color:#17352e;font-size:12px;text-align:right;word-break:break-all;border-top:1px solid #e4ece8;">${safeIban}</td></tr>
                <tr><td style="padding:13px 16px;background:#fbfdfc;color:#72847e;font-size:13px;border-top:1px solid #e4ece8;">Code SWIFT</td><td style="padding:13px 16px;background:#fbfdfc;color:#17352e;font-size:13px;text-align:right;border-top:1px solid #e4ece8;">${safeSwift}</td></tr>
                <tr><td style="padding:13px 16px;color:#72847e;font-size:13px;border-top:1px solid #e4ece8;">Code banque</td><td style="padding:13px 16px;color:#17352e;font-size:13px;text-align:right;border-top:1px solid #e4ece8;">${safeBankCode}</td></tr>
                <tr><td style="padding:13px 16px;background:#fbfdfc;color:#72847e;font-size:13px;border-top:1px solid #e4ece8;">Libellé</td><td style="padding:13px 16px;background:#fbfdfc;color:#17352e;font-size:13px;text-align:right;border-top:1px solid #e4ece8;">${safeLabel}</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 34px;background:#123c32;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:13px;font-weight:bold;">Espace Client</p>
              <p style="margin:7px 0 0;color:#b9d8cc;font-size:12px;line-height:1.6;">Ne répondez pas à cet e-mail automatique.<br>Pour votre sécurité, ne communiquez jamais vos codes secrets.</p>
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;color:#8a9b95;font-size:11px;text-align:center;">Cet e-mail est une confirmation automatique de votre opération.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
};


const app = express();
app.use(cors());
app.use(express.json());

const requiredEnv = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  console.warn(`Missing environment variables: ${missingEnv.join(', ')}.`);
}

// Configuration du transporteur Gmail
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true', // false pour 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Doit être ton mot de passe d'application à 16 caractères
  },
  tls: {
    // Crucial sur Vercel pour éviter les rejets de certificats SSL
    rejectUnauthorized: false
  }
});

const recentRequests = new Map();
const duplicateWindowMs = 10000;

const getRequestKey = (body) => {
  if (body.requestId) {
    return `RID:${String(body.requestId)}`;
  }
  return [
    String(body.email || '').trim().toLowerCase(),
    Number(body.amount) || 0,
    String(body.iban || '').trim().toUpperCase(),
    String(body.swift || '').trim().toUpperCase(),
    String(body.bankCode || '').trim(),
    String(body.firstName || '').trim().toLowerCase(),
    String(body.lastName || '').trim().toLowerCase(),
    String(body.label || '').trim().toLowerCase(),
  ].join('|');
};

app.post('/api/send-email', async (req, res) => {
  const { requestId, firstName, lastName, iban, swift, bankCode, amount, email, label } = req.body;
  const amountNumber = parseFloat(amount);

  if (!firstName || !lastName || !iban || !swift || !bankCode || !amount || !email || Number.isNaN(amountNumber)) {
    return res.status(400).json({ message: 'Champs requis manquants ou invalides pour le virement.' });
  }

  if (missingEnv.length > 0) {
    return res.status(500).json({
      message: `Configuration serveur manquante: ${missingEnv.join(', ')}`,
    });
  }

  const key = getRequestKey({ requestId, firstName, lastName, iban, swift, bankCode, amount: amountNumber, email, label });
  const now = Date.now();
  const lastTime = recentRequests.get(key);

  if (lastTime && now - lastTime < duplicateWindowMs) {
    console.warn('Duplicate send-email request ignored for:', key);
    return res.status(409).json({ message: 'Requête dupliquée ignorée.' });
  }

  recentRequests.set(key, now);

  const formattedAmount = amountNumber.toFixed(2).replace('.', ',');

  const currentExecutionDate = new Date().toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(',', ' à');

  const uniqueReference = `BNP${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Date.now().toString().slice(-6)}`;

  const bnpHtmlTemplate = buildTransferEmail({
    firstName,
    lastName,
    iban,
    swift,
    bankCode,
    amount: formattedAmount,
    label,
    executionDate: currentExecutionDate,
    reference: uniqueReference
  });

  const mailOptions = {
    from: `"BNP Paribas" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: `BNP Paribas - Confirmation de votre virement`,
    text: `Bonjour ${firstName} ${lastName},\n\nVotre virement de ${formattedAmount} € a bien été enregistré.`,
    html: bnpHtmlTemplate,
    attachments: [
      {
        filename: 'bnp-paribas-logo.png',
        content: logoBase64,
        encoding: 'base64',
        cid: 'bnp-logo-confirmation@bnpp'
      }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return res.status(200).json({
      message: 'E-mail envoyé avec succès.',
      info: { messageId: info.messageId, accepted: info.accepted },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({
      message: 'Impossible d\'envoyer l\'e-mail.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});


export { app, buildTransferEmail };
export default app;

// En local, Vercel ne lance pas automatiquement la fonction serverless.
// On démarre donc Express sur le port 3001 uniquement hors production.
if (process.env.NODE_ENV !== 'production') {
  const port = Number(process.env.PORT) || 3001;
  app.listen(port, () => {
    console.log(`API e-mail disponible sur http://localhost:${port}`);
  });
}
