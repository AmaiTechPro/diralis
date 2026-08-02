import "dotenv/config";

import { sendEmail } from "../services/emailService";

async function main() {
  await sendEmail({
    to: "team.diralis@gmail.com",
    subject: "Diralis Email Test 🚀",
    html: `
      <h1>Congratulations!</h1>

      <p>Your Diralis email service is working successfully.</p>

      <p>You're now ready to implement password recovery.</p>
    `,
  });

  console.log("✅ Test email sent successfully.");
}

main().catch(console.error);

