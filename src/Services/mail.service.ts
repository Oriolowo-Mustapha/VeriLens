const SibApiV3Sdk = require('sib-api-v3-sdk');
import logger from '../Utils/logger';

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendVerificationEmail = async (email: string, token: string, firstName: string) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  const verificationLink = `${process.env.CLIENT_URL || 'https://verilens-frontend.pxxl.click'}/verify-email?token=${token}`;

  sendSmtpEmail.subject = "Verify Your Account - VeriLENS";
  sendSmtpEmail.htmlContent = `
    <html>
      <body>
        <h1>Hello ${firstName},</h1>
        <p>Thank you for registering. Please verify your account by clicking the link below:</p>
        <a href="${verificationLink}">Verify Account</a>
        <p>If you did not request this, please ignore this email.</p>
      </body>
    </html>
  `;
  sendSmtpEmail.sender = { name: "VeriLENS", email: process.env.BREVO_SENDER_EMAIL || "noreply@verilens.com" };
  sendSmtpEmail.to = [{ email: email, name: firstName }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    logger.info(`Verification email sent to ${email}`);
  } catch (error: any) {
    logger.error(`Error sending verification email: ${error.message}`);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string, token: string, firstName: string) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  const resetLink = `${process.env.CLIENT_URL || 'https://verilens-frontend.pxxl.click'}/reset-password?token=${token}`;

  sendSmtpEmail.subject = "Reset Your Password - VeriLENS";
  sendSmtpEmail.htmlContent = `
    <html>
      <body>
        <h1>Hello ${firstName},</h1>
        <p>You requested a password reset. Please click the link below to set a new password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
      </body>
    </html>
  `;
  sendSmtpEmail.sender = { name: "VeriLENS", email: process.env.BREVO_SENDER_EMAIL || "noreply@verilens.com" };
  sendSmtpEmail.to = [{ email: email, name: firstName }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    logger.info(`Password reset email sent to ${email}`);
  } catch (error: any) {
    logger.error(`Error sending password reset email: ${error.message}`);
    throw error;
  }
};
