import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@rafit.app';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    console.log(`[Email] Dev mode — would send to ${to}:`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${html.substring(0, 200)}...`);
    return { success: true, messageId: 'dev-mode' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Email] Send failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('[Email] Unexpected error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendCustomerInvitation({
  email,
  token,
  tenantName,
  inviterName,
}: {
  email: string;
  token: string;
  tenantName: string;
  inviterName: string;
}) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const registerUrl = `${baseUrl}/portal/register?token=${token}`;

  return sendEmail({
    to: email,
    subject: `הזמנה להצטרף ל${tenantName}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>שלום!</h2>
        <p>${inviterName} מזמין/ה אותך להצטרף לפורטל הלקוחות של <strong>${tenantName}</strong>.</p>
        <p>דרך הפורטל תוכל/י:</p>
        <ul>
          <li>לצפות בלוח השיעורים ולהירשם</li>
          <li>לנהל את ההזמנות שלך</li>
          <li>לצפות בפרטי המנוי והתשלומים</li>
        </ul>
        <p style="margin: 24px 0;">
          <a href="${registerUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
            הרשמה לפורטל
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">הקישור תקף ל-7 ימים.</p>
      </div>
    `,
  });
}
