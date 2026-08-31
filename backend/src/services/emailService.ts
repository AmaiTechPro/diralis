import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM =
  process.env.EMAIL_FROM ?? "Diralis <no-reply@diralishq.com>";

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  const { data, error } = await resend.emails.send({
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

function baseEmailTemplate(title: string, bodyContent: string) {
  return `
    <div
      style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: auto;
        padding: 24px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
      "
    >
      <h2 style="color: #06b6d4; margin-bottom: 20px;">
        ${title}
      </h2>

      ${bodyContent}

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />

      <p
        style="
          color: #64748b;
          font-size: 13px;
          text-align: center;
        "
      >
        This is an automated message from Diralis. Please do not reply to this email.
      </p>

      <p
        style="
          color: #94a3b8;
          font-size: 12px;
          text-align: center;
        "
      >
        © ${new Date().getFullYear()} Diralis. All rights reserved.
      </p>
    </div>
  `;
}

/* -------------------------------------------------- */
/* Email Verification                                  */
/* -------------------------------------------------- */

export async function sendVerificationEmail(
  email: string,
  fullName: string,
  code: string
) {
  return sendEmail({
    to: email,
    subject: "Verify your Diralis account",
    html: baseEmailTemplate(
      "Welcome to Diralis",
      `
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>
          Thank you for creating your Diralis account.
          To protect your account and verify that this email address belongs to you,
          please enter the verification code below.
        </p>

        <div
          style="
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
            padding: 18px;
            margin: 30px 0;
            background: #ecfeff;
            color: #0891b2;
            border-radius: 10px;
          "
        >
          ${code}
        </div>

        <p>
          This verification code will expire in <strong>10 minutes</strong>.
        </p>
        <p>
          If you did not create a Diralis account, you can safely ignore this email.
        </p>
      `
    ),
  });
}

/* -------------------------------------------------- */
/* Billing & Lifecycle Notifications                  */
/* -------------------------------------------------- */

export async function sendPaymentSuccessEmail(
  email: string,
  fullName: string,
  amount: number,
  currency: string,
  planName: string,
  receiptUrl?: string
) {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);

  return sendEmail({
    to: email,
    subject: `Payment Receipt: ${formattedAmount} for Diralis ${planName}`,
    html: baseEmailTemplate(
      "Payment Confirmed",
      `
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>We received your payment of <strong>${formattedAmount}</strong> for your <strong>${planName}</strong> plan.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #475569;"><strong>Plan:</strong> ${planName}</p>
          <p style="margin: 0 0 8px 0; color: #475569;"><strong>Amount:</strong> ${formattedAmount}</p>
          <p style="margin: 0; color: #475569;"><strong>Date:</strong> ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        ${
          receiptUrl
            ? `<p><a href="${receiptUrl}" style="display:inline-block;background:#0891b2;color:#ffffff;padding:10px 20px;border-radius:6px;text-decoration:none;">View Receipt</a></p>`
            : ""
        }
        <p>Thank you for choosing Diralis for your AI Decision Intelligence needs.</p>
      `
    ),
  });
}

export async function sendSubscriptionActivatedEmail(
  email: string,
  fullName: string,
  planName: string,
  interval: string
) {
  return sendEmail({
    to: email,
    subject: `Your Diralis ${planName} subscription is now active!`,
    html: baseEmailTemplate(
      "Subscription Activated",
      `
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>Your subscription to the <strong>${planName}</strong> plan (${interval.toLowerCase()}) is now officially active.</p>
        <p>All higher limits and premium capabilities are available immediately in your dashboard.</p>
      `
    ),
  });
}

export async function sendSubscriptionCancelledEmail(
  email: string,
  fullName: string,
  planName: string,
  effectiveEndDate: Date | null
) {
  const formattedDate = effectiveEndDate
    ? effectiveEndDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "the end of your current billing period";

  return sendEmail({
    to: email,
    subject: "Diralis Subscription Cancellation Notice",
    html: baseEmailTemplate(
      "Subscription Cancelled",
      `
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>We received your request to cancel your <strong>${planName}</strong> subscription.</p>
        <p>You will retain full access to all ${planName} features until <strong>${formattedDate}</strong>. After this date, your account will move to the Free tier.</p>
        <p>If you ever change your mind, you can reactivate your plan at any time from your billing settings.</p>
      `
    ),
  });
}

export async function sendPaymentFailedEmail(
  email: string,
  fullName: string,
  amount: number,
  currency: string
) {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);

  return sendEmail({
    to: email,
    subject: "Action Required: Payment failed for your Diralis subscription",
    html: baseEmailTemplate(
      "Payment Unsuccessful",
      `
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>We were unable to process your payment of <strong>${formattedAmount}</strong> for your Diralis subscription.</p>
        <p>Please update your billing information or payment method to avoid any interruption to your decision intelligence workflows.</p>
      `
    ),
  });
}

export async function sendUsageLimitWarningEmail(
  email: string,
  fullName: string,
  resourceName: string,
  currentUsage: number,
  limit: number
) {
  return sendEmail({
    to: email,
    subject: `Usage Alert: You have used 80% of your ${resourceName} limit on Diralis`,
    html: baseEmailTemplate(
      "Usage Limit Notice",
      `
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>You have consumed <strong>${currentUsage} of ${limit}</strong> allocated units for <strong>${resourceName}</strong> on your current billing cycle.</p>
        <p>To avoid hitting hard limits and halting data processing or AI workflows, consider upgrading your subscription plan.</p>
      `
    ),
  });
}


