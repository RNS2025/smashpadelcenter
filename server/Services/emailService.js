const nodemailer = require("nodemailer");
const logger = require("../config/logger");
const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });

// Create reusable transporter with better error handling
let transporter;

try {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    debug: process.env.NODE_ENV !== "production", // Enable extra logging in development
  });

  logger.info("Email transporter created");
} catch (error) {
  logger.error("Failed to create email transporter:", { error: error.message });
}

// Verify connection configuration
const verifyConnection = async () => {
  if (!transporter) {
    logger.error("Email transporter not initialized");
    throw new Error("Email transporter not initialized");
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    logger.error("Missing email credentials in environment variables");
    throw new Error("Missing email credentials in environment variables");
  }

  try {
    const verified = await transporter.verify();
    logger.info("SMTP connection verified successfully");
    return verified;
  } catch (error) {
    logger.error("SMTP connection verification failed:", {
      error: error.message,
      host: transporter?.options?.host,
      secure: transporter?.options?.secure,
      user: process.env.EMAIL_USER?.substring(0, 5) + "...", // Log partial email for debugging
    });
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (userEmail, resetURL) => {
  if (!transporter) {
    logger.error(
      "Cannot send password reset email: Email transporter not initialized"
    );
    throw new Error("Email service unavailable");
  }

  const mailOptions = {
    to: userEmail,
    from: `"Smash Padel Center" <${process.env.EMAIL_USER}>`,
    subject: "Nulstil din adgangskode",
    text: `Hej,\n\nDu modtager denne email, fordi du (eller en anden) har anmodet om at nulstille din adgangskode.\n\n
    Klik på følgende link eller kopier det til din browser for at fortsætte processen:\n\n
    ${resetURL}\n\n
    Dette link er gyldigt i 2 timer.\n\n
    Hvis du ikke anmodede om dette, bedes du ignorere denne email og din adgangskode forbliver uændret.\n\n
    Med venlig hilsen,\n
    Smash Padel Center Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4A90E2;">Nulstil din adgangskode</h2>
        <p>Hej,</p>
        <p>Du modtager denne email, fordi du (eller en anden) har anmodet om at nulstille din adgangskode.</p>
        <p>Klik på knappen nedenfor for at nulstille din adgangskode:</p>
        <p style="text-align: center;">
          <a href="${resetURL}" style="background-color: #4A90E2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Nulstil adgangskode</a>
        </p>
        <p>Eller kopier dette link til din browser: <a href="${resetURL}">${resetURL}</a></p>
        <p>Dette link er gyldigt i 2 timer.</p>
        <p>Hvis du ikke anmodede om dette, bedes du ignorere denne email og din adgangskode forbliver uændret.</p>
        <p>Med venlig hilsen,<br>Smash Padel Center Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info("Password reset email sent successfully", {
      messageId: info.messageId,
      email: userEmail,
    });
    return info;
  } catch (error) {
    logger.error("Failed to send password reset email:", {
      error: error.message,
      email: userEmail,
    });
    throw error;
  }
};

// Send password changed confirmation email
const sendPasswordChangedEmail = async (userEmail, userName) => {
  if (!transporter) {
    logger.error(
      "Cannot send password changed email: Email transporter not initialized"
    );
    throw new Error("Email service unavailable");
  }

  const mailOptions = {
    to: userEmail,
    from: `"Smash Padel Center" <${process.env.EMAIL_USER}>`,
    subject: "Din adgangskode er blevet ændret",
    text: `Hej ${userName},\n\n
    Dette er en bekræftelse på, at adgangskoden for din konto hos Smash Padel Center er blevet ændret.\n\n
    Hvis du ikke foretog denne ændring, bedes du straks kontakte os ved at svare på denne email.\n\n
    Med venlig hilsen,\n
    Smash Padel Center Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4A90E2;">Bekræftelse af ændret adgangskode</h2>
        <p>Hej ${userName},</p>
        <p>Dette er en bekræftelse på, at adgangskoden for din konto hos Smash Padel Center er blevet ændret.</p>
        <p>Hvis du ikke foretog denne ændring, bedes du straks kontakte os ved at svare på denne email.</p>
        <p>Med venlig hilsen,<br>Smash Padel Center Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info("Password changed email sent successfully", {
      messageId: info.messageId,
      email: userEmail,
    });
    return info;
  } catch (error) {
    logger.error("Failed to send password changed email:", {
      error: error.message,
      email: userEmail,
    });
    throw error;
  }
};

module.exports = {
  verifyConnection,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
};
