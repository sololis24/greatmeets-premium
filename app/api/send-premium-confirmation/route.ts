import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { customerEmail, customerName, price, manageLink } = await req.json();

  const html = `
    <div style="font-family: 'Arial', sans-serif; background-color: #f4f4f4; padding: 20px; text-align: center;">
      <div style="background-color: #ffffff; max-width: 600px; margin: auto; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h1 style="font-size: 24px; color: #10b981; font-weight: bold;">Welcome to GreatMeets Pro 🎉</h1>
        <p style="font-size: 16px; color: #333;">Hey ${customerName || 'there'}, thanks for upgrading!</p>
        <p style="font-size: 15px; color: #333;">
          You’re now on <strong>GreatMeets Pro</strong> at <strong>${price}</strong> per month.
        </p>

        <a href="${manageLink}" 
           style="display: inline-block; margin: 30px auto 0; background: linear-gradient(90deg, #10b981, #6366f1); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          Manage Subscription
        </a>

        <p style="font-size: 14px; color: #666666; margin-top: 30px;">
          Powered by <a href="https://www.greatmeets.ai" style="color: #10b981; text-decoration: underline;"><strong>GreatMeets.ai</strong></a> 🚀 — Fast and Human Scheduling.
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: 'Great Meets <noreply@greatmeets.ai>',
    to: customerEmail,
    subject: '✅ Your GreatMeets Pro Subscription is Active',
    html,
  });

  return new Response('Premium welcome email sent.', { status: 200 });
}
