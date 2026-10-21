import "dotenv/config";
import { sendTransactionalEmail } from "./utils/bookingNotifications.js";

const testEmail = async () => {
  try {
    const result = await sendTransactionalEmail({
      to: "rikinoc189@proguidex.com", // Replace this
      subject: "BookMe - Test Email",
      text: "Congratulations! Your Brevo email integration is working.",
      htmlContent: `
        <h2>Welcome to BookMe!</h2>
        <p>This is a test email from your Express backend.</p>
      `,
      senderName: "BookMe",
    });

    console.log("Email request successful:", result);
  } catch (error) {
    console.error("Email test failed:", error.message);
  }
};

testEmail();