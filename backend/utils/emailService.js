import nodemailer from 'nodemailer';

// Create transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'zahmedasim@gmail.com',
    pass: 'gembwcdhrvcwttbo', // App-specific password (spaces removed)
  },
});

export const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: {
        name: 'SummitCoreHomes',
        address: 'zahmedasim@gmail.com',
      },
      to: email,
      subject: 'Password Reset OTP - SummitCoreHomes',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Password Reset Request</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              You have requested to reset your password. Please use the following OTP to proceed:
            </p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 8px; margin: 0;">
                ${otp}
              </p>
            </div>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
              This OTP is valid for <strong>30 minutes</strong> only. If you did not request this password reset, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              This is an automated message from SummitCoreHomes. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email: ', error);
    throw new Error('Failed to send OTP email');
  }
};

