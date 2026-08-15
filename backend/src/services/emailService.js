import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Email not configured - emails will be logged to console');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  const transport = getTransporter();

  if (!transport) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
    return { success: true, mock: true };
  }

  await transport.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });

  return { success: true };
};

export const sendVerificationEmail = async (user, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your Campus Lost & Found account',
    html: `
      <h2>Welcome, ${user.name}!</h2>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${url}">${url}</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

export const sendPasswordResetEmail = async (user, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your password',
    html: `
      <h2>Password Reset</h2>
      <p>Hi ${user.name}, click the link below to reset your password:</p>
      <a href="${url}">${url}</a>
      <p>This link expires in 1 hour.</p>
    `,
  });
};
