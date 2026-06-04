import { config } from "./config.js";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function sendVerificationCode({ email, name, code }) {
  if (!config.resendApiKey) {
    if (process.env.VERCEL) {
      throw new Error("RESEND_API_KEY is required to send verification emails");
    }

    console.log(`Verification code for ${email}: ${code}`);
    return;
  }

  const safeName = escapeHtml(name);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: config.emailFrom,
      to: [email],
      subject: "Verify your Nexora account",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#17202a">
          <h2>Verify your Nexora account</h2>
          <p>Hello ${safeName},</p>
          <p>Use this verification code to activate your account:</p>
          <p style="font-size:32px;font-weight:700;margin:24px 0">${code}</p>
          <p>This code expires in 10 minutes.</p>
          <p>If you did not expect this email, you can ignore it.</p>
        </div>
      `,
      text: `Hello ${name}, your Nexora verification code is ${code}. This code expires in 10 minutes.`
    })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || "Failed to send verification email");
  }
}
