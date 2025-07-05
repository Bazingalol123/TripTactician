const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other services or SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (to, token) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: 'Verify Your Travel Buddy Account',
    html: `
      <p>Please verify your email by clicking on this link:</p>
      <p><a href="${process.env.FRONTEND_URL}/verify-email?token=${token}">Verify Email</a></p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (to, token) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: 'Password Reset Request',
    html: `
      <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
      <p>Please click on the following link, or paste this into your browser to complete the process:</p>
      <p><a href="${process.env.FRONTEND_URL}/reset-password?token=${token}">Reset Password</a></p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail }; 