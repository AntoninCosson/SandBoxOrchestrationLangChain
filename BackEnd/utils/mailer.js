const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function verifyMailer() {
  try {
    await transporter.verify();
    console.log("[MAILER] Transporter OK →", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: mask(process.env.SMTP_USER),
      from: process.env.SMTP_FROM,
    });
  } catch (e) {
    console.error("[MAILER] Transporter ERROR →", e.message);
  }
}

function mask(v) {
  if (!v) return v;
  if (v.includes("@")) {
    const [name, domain] = v.split("@");
    return `${name.slice(0, 3)}***@${domain}`;
  }
  return v.slice(0, 3) + "***";
}

async function sendMail({ to, subject, html, text }) {
  console.log("📨 [sendMail] Preparing to send:", { to, subject });
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });
  console.log("[MAILER] sent →", {
    to,
    messageId: info.messageId,
    accepted: info.accepted,
  });

  console.log("📨 [sendMail] Message sent:", info.messageId);
  console.log("📨 Accepted:", info.accepted);
  console.log("📨 Rejected:", info.rejected);

  return info;
}

module.exports = { transporter, verifyMailer, sendMail };
