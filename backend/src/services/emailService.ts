import { Resend } from "resend";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  const { data, error } =
    await resend.emails.send({
      from: "Diralis <onboarding@resend.dev>",

      to: options.to,

      subject: options.subject,

      html: options.html,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

