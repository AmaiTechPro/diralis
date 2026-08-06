import { Resend } from "resend";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

const FROM =
  process.env.EMAIL_FROM ??
  "Diralis <no-reply@diralishq.com>";

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  const { data, error } =
    await resend.emails.send({
      from: FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/* -------------------------------------------------- */
/* Email Verification */
/* -------------------------------------------------- */

export async function sendVerificationEmail(
  email: string,
  fullName: string,
  code: string
) {
  return sendEmail({
    to: email,
    subject: "Verify your Diralis account",
    html: `
      <div
        style="
          font-family:Arial,sans-serif;
          max-width:600px;
          margin:auto;
          padding:24px;
          background:#ffffff;
          border:1px solid #e5e7eb;
          border-radius:12px;
        "
      >

        <h2 style="color:#06b6d4;margin-bottom:20px;">
          Welcome to Diralis
        </h2>

        <p>Hello <strong>${fullName}</strong>,</p>

        <p>
          Thank you for creating your Diralis account.
          To protect your account and verify that this
          email address belongs to you, please enter the
          verification code below.
        </p>

        <div
          style="
            font-size:36px;
            font-weight:bold;
            letter-spacing:8px;
            text-align:center;
            padding:18px;
            margin:30px 0;
            background:#ecfeff;
            color:#0891b2;
            border-radius:10px;
          "
        >
          ${code}
        </div>

        <p>
          This verification code will expire in
          <strong>10 minutes</strong>.
        </p>

        <p>
          If you did not create a Diralis account,
          you can safely ignore this email.
        </p>

        <hr style="margin:30px 0;border:none;border-top:1px solid #e5e7eb;" />

        <p
          style="
            color:#64748b;
            font-size:13px;
            text-align:center;
          "
        >
          This is an automated message from Diralis.
          Please do not reply to this email.
        </p>

        <p
          style="
            color:#94a3b8;
            font-size:12px;
            text-align:center;
          "
        >
          © ${new Date().getFullYear()} Diralis. All rights reserved.
        </p>

      </div>
    `,
  });
}

