const axios = require("axios");

const MAILER_API_URL = process.env.MAILER_API_URL || "http://localhost:4000";
const MAILER_API_KEY = process.env.MAILER_API_KEY;
const AUTH_PUBLIC_URL = process.env.AUTH_PUBLIC_URL || "http://localhost:3000";

function getVerificationLink(token) {
  const base = AUTH_PUBLIC_URL.replace(/\/$/, "");
  return `${base}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

const SKIP_MAIL_SEND = process.env.SKIP_MAIL_SEND === "1" || process.env.SKIP_MAIL_SEND === "true";

async function sendVerificationEmail(to, username, token) {
  const link = getVerificationLink(token);

  if (SKIP_MAIL_SEND) {
    console.log("[dev] Письмо не отправляется (SKIP_MAIL_SEND). Ссылка для подтверждения:", link);
    return { skipped: true };
  }

  if (!MAILER_API_KEY) {
    throw new Error("MAILER_API_KEY не задан в .env");
  }
  const subject = "Подтверждение регистрации";
  const html = `
    <p>Здравствуйте, <strong>${escapeHtml(username)}</strong>.</p>
    <p>Для завершения регистрации перейдите по ссылке:</p>
    <p><a href="${escapeHtml(link)}">Подтвердить email</a></p>
    <p>Ссылка действительна 24 часа.</p>
    <p>Если вы не регистрировались, проигнорируйте это письмо.</p>
  `;
  const text = `Подтверждение регистрации. Перейдите по ссылке: ${link}`;

  const { data } = await axios.post(
    `${MAILER_API_URL.replace(/\/$/, "")}/api/send`,
    { to, subject, text, html },
    {
      headers: { "x-api-key": MAILER_API_KEY },
      timeout: 10000,
    }
  );
  return data;
}

function escapeHtml(s) {
  if (typeof s !== "string") return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = {
  sendVerificationEmail,
  getVerificationLink,
};
