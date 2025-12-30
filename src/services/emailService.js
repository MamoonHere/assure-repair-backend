const nodemailer = require("nodemailer");

const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error(
      "SMTP configuration is missing. Please set SMTP_USER and SMTP_PASSWORD environment variables."
    );
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  return transporter;
};

exports.sendPasswordSetEmail = async (email, firstName, lastName, token) => {
  try {
    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const setPasswordUrl = `${frontendUrl}/set-password?token=${token}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Set Your Password - Assure Repair",
      html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <style>
                  body {
                    margin: 0;
                    padding: 0;
                    background-color: #f4f6f8;
                    font-family: Arial, Helvetica, sans-serif;
                    color: #333;
                  }
                  .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
                  }
                  .header {
                    background: linear-gradient(90deg, #22245c 0%, #0e5fa5 100%);
                    padding: 24px;
                    text-align: center;
                  }
                  .logo {
                    max-width: 180px;
                    margin-bottom: 10px;
                    background-color: #ffffff;
                    padding: 10px 14px;
                    border-radius: 6px;
                  }
                  .header h1 {
                    color: #ffffff;
                    margin: 0;
                    font-size: 22px;
                    font-weight: 600;
                  }
                  .content {
                    padding: 30px 24px;
                    background-color: #ffffff;
                  }
                  .content p {
                    margin: 0 0 16px;
                    font-size: 15px;
                    line-height: 1.6;
                  }
                  .button-wrapper {
                    text-align: center;
                    margin: 30px 0;
                  }
                  .button {
                    display: inline-block;
                    padding: 14px 28px;
                    background: linear-gradient(90deg, #22245c 0%, #0e5fa5 100%);
                    color: #ffffff !important;
                    text-decoration: none;
                    border-radius: 6px;
                    font-size: 15px;
                    font-weight: 600;
                  }
                  .link {
                    word-break: break-all;
                    font-size: 13px;
                    color: #0e5fa5;
                  }
                  .footer {
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #777;
                    background-color: #f4f6f8;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <img
                      src="https://assurerepair.com/wp-content/uploads/2025/09/Untitled-design-14-scaled-e1757424242558.png"
                      alt="Assure Repair Logo"
                      class="logo"
                    />
                    <h1>Welcome to Assure Repair</h1>
                  </div>

                  <div class="content">
                    <p>Hello ${firstName} ${lastName},</p>

                    <p>
                      Your account has been created. To get started, please set your password
                      by clicking the button below.
                    </p>

                    <div class="button-wrapper">
                      <a href="${setPasswordUrl}" class="button">Set Your Password</a>
                    </div>

                    <p>If the button above does not work, copy and paste this link into your browser:</p>

                    <p class="link">${setPasswordUrl}</p>

                    <p><strong>This link will expire in 24 hours.</strong></p>

                    <p>
                      If you did not request this account, you can safely ignore this email.
                    </p>
                  </div>

                  <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Assure Repair. All rights reserved.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
      text: `
            Welcome to Assure Repair

            Hello ${firstName} ${lastName},

            Your account has been created. Please set your password using the link below:

            ${setPasswordUrl}

            This link will expire in 24 hours.

            If you did not request this account, please ignore this email.

            © ${new Date().getFullYear()} Assure Repair. All rights reserved.
          `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password set email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending password set email:", error);
    throw new Error(
      "Failed to send email. Please check your email configuration."
    );
  }
};
