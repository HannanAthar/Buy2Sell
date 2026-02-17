import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import sgMail from "@sendgrid/mail";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ .env is in backend/
dotenv.config({ path: path.join(__dirname, "..", ".env") });

console.log(
  "DEBUG SENDGRID key present?",
  !!process.env.SENDGRID_API_KEY
);
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "42891@students.riphah.edu.pk"; 
const BRAND_NAME = "Buy2Sell";

if (!SENDGRID_API_KEY) {
  console.warn("⚠️ SENDGRID_API_KEY not set – emails will NOT send.");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}
console.log("✅ SENDGRID_API_KEY loaded:", !!process.env.SENDGRID_API_KEY);

/**
 * Basic email sender.
 * Usage: await sendEmail({ to, subject, html })
 */
/**
 * Helper to strip HTML for plain text version
 */
const stripHtml = (html) => {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .trim();
};

/**
 * Basic email sender.
 * Usage: await sendEmail({ to, subject, html })
 */
export const sendEmail = async ({ to, subject, html }) => {
  if (!SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY is missing – cannot send email.");
  }
  if (!FROM_EMAIL) {
    throw new Error("SENDGRID_FROM_EMAIL is missing – cannot send email.");
  }
  if (!to) {
    throw new Error("Recipient email (to) is required.");
  }

  // Auto-generate plain text version if not provided
  const text = stripHtml(html);

  const msg = {
    to,
    from: FROM_EMAIL, // Use the constant which pulls from env or fallback
    replyTo: FROM_EMAIL,
    subject,
    html,
    text, // Essential for spam filters
  };

  const [response] = await sgMail.send(msg);
  return {
    statusCode: response.statusCode,
    headers: response.headers,
  };
};

/**
 * Common HTML wrapper for all email bodies.
 */
const wrap = (title, contentHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:Arial, Helvetica, sans-serif;background:#f4f4f4;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:#16a34a;color:#ffffff;padding:20px 24px;font-size:24px;font-weight:bold;text-align:center;">
              ${BRAND_NAME}
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;font-size:16px;line-height:1.6;color:#374151;">
              ${contentHtml}
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:24px;font-size:12px;color:#6b7280;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 10px 0;">© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
              <p style="margin:0 0 10px 0;">
                123 Fashion Street, Design District<br/>
                Islamabad, Pakistan
              </p>
              <p style="margin:0;">
                <a href="${process.env.FRONTEND_URL || '#'}/settings/notifications" style="color:#16a34a;text-decoration:underline;">Unsubscribe</a> 
                from these emails.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * BUYER / GENERAL USER TEMPLATES
 */
export const buyerTemplates = {
  // 1. Account Registration – Verify email
  registrationVerify: (to, verifyLink) => ({
    to,
    subject: `Verify your email address – ${BRAND_NAME}`,
    html: wrap(
      "Verify your email address",
      `
      <p>Hi,</p>
      <p>Welcome to <strong>${BRAND_NAME}</strong>! Please verify your email address to activate your account.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${verifyLink}"
           style="display:inline-block;padding:10px 20px;background:#16a34a;color:#ffffff;
                  text-decoration:none;border-radius:4px;font-weight:bold;">
          Verify Email
        </a>
      </p>
      <p>If you did not create this account, you can safely ignore this email.</p>
      `
    ),
  }),

  // 2. Password Reset
  passwordReset: (to, resetLink) => ({
    to,
    subject: `Reset your password – ${BRAND_NAME}`,
    html: wrap(
      "Reset your password",
      `
      <p>Hi,</p>
      <p>We received a request to reset your password.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${resetLink}"
           style="display:inline-block;padding:10px 20px;background:#2563eb;color:#ffffff;
                  text-decoration:none;border-radius:4px;font-weight:bold;">
          Reset Password
        </a>
      </p>
      <p>This link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can ignore this email.</p>
      `
    ),
  }),

  // 3. Order Confirmation
  orderConfirmation: (to, order) => ({
    to,
    subject: `Order #${order._id} confirmed – ${BRAND_NAME}`,
    html: wrap(
      "Order Confirmed",
      `
      <p>Hi,</p>
      <p>Thank you for shopping with <strong>${BRAND_NAME}</strong>.</p>
      <p>Your order <strong>#${order._id}</strong> has been <strong>confirmed</strong>.</p>
      <p><strong>Amount:</strong> ${order.totals?.grandTotal?.toLocaleString?.() || order.totals?.grandTotal || ""} RS</p>
      <p><strong>Payment method:</strong> ${order.payment?.method?.toUpperCase()}</p>
      <p style="margin-top:16px;"><strong>Shipping to:</strong><br/>
        ${order.shippingAddress?.fullName}<br/>
        ${order.shippingAddress?.addressLine}<br/>
        ${order.shippingAddress?.city}, ${order.shippingAddress?.country || "Pakistan"}
      </p>
      <p style="margin-top:16px;"><strong>Items:</strong></p>
      <ul>
        ${(order.items || [])
          .map(
            (it) =>
              `<li>${it.name} &times; ${it.quantity} – ${it.unitPrice} RS each</li>`
          )
          .join("")}
      </ul>
      <p style="margin-top:16px;">We will notify you again once your order is delivered.</p>
      `
    ),
  }),

  // 4. Order Delivered
  orderDelivered: (to, order) => ({
    to,
    subject: `Order #${order._id} delivered – ${BRAND_NAME}`,
    html: wrap(
      "Order Delivered",
      `
      <p>Hi,</p>
      <p>Your order <strong>#${order._id}</strong> has been delivered.</p>
      <p>Please confirm that you have received all items in good condition.</p>
      <p>If there is any issue, you can reply to this email or contact our support.</p>
      `
    ),
  }),

  // 5. Payment Successful
  paymentSuccessful: (to, order) => ({
    to,
    subject: `Payment received for order #${order._id} – ${BRAND_NAME}`,
    html: wrap(
      "Payment Successful",
      `
      <p>Hi,</p>
      <p>We have received your payment of 
         <strong>${order.totals?.grandTotal?.toLocaleString?.() || order.totals?.grandTotal} RS</strong>
         for order <strong>#${order._id}</strong>.</p>
      <p>Payment method: <strong>${order.payment?.method?.toUpperCase()}</strong></p>
      <p>Thank you for shopping with us!</p>
      `
    ),
  }),

  // 6. Payment Failed
  paymentFailed: (to, orderId, amount) => ({
    to,
    subject: `Payment failed for order #${orderId} – ${BRAND_NAME}`,
    html: wrap(
      "Payment Failed",
      `
      <p>Hi,</p>
      <p>Your payment of <strong>${amount} RS</strong> for order <strong>#${orderId}</strong> has failed.</p>
      <p>Please update your payment method or try again. If the amount was debited from your bank,
         please contact our support with the transaction details.</p>
      `
    ),
  }),

  // 7. Rental Reminder
  rentalReminder: (to, { productName, returnDate, orderId }) => ({
    to,
    subject: `Rental reminder – return date coming up for ${productName}`,
    html: wrap(
      "Rental Reminder",
      `
      <p>Hi,</p>
      <p>This is a friendly reminder that your rented item 
         <strong>${productName}</strong> (order <strong>#${orderId}</strong>)
         should be returned by <strong>${returnDate}</strong>.</p>
      <p>Please make sure to return it on time to avoid any late fees.</p>
      `
    ),
  }),
};

/**
 * RESELLER TEMPLATES
 */
export const resellerTemplates = {
  // 8. Item Verification – Verified
  itemVerified: (to, { itemName }) => ({
    to,
    subject: `Your item "${itemName}" has been verified – ${BRAND_NAME}`,
    html: wrap(
      "Item Verified",
      `
      <p>Hi,</p>
      <p>Your item <strong>${itemName}</strong> has been <strong>VERIFIED</strong> by our team 
         and is now live on the marketplace.</p>
      <p>Best of luck with your sales!</p>
      `
    ),
  }),

  // 9. Item Rejected
  itemRejected: (to, { itemName, reason }) => ({
    to,
    subject: `Your item "${itemName}" was rejected – ${BRAND_NAME}`,
    html: wrap(
      "Item Rejected",
      `
      <p>Hi,</p>
      <p>Unfortunately, your item <strong>${itemName}</strong> has been 
         <strong>rejected</strong>.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>You can fix the issue (for example, better images or correct details) and resubmit the item.</p>
      `
    ),
  }),

  // 10. Sale Notification
  saleNotification: (to, { itemName, amount, orderId }) => ({
    to,
    subject: `Congrats! Your item "${itemName}" was sold – ${BRAND_NAME}`,
    html: wrap(
      "Item Sold",
      `
      <p>Hi,</p>
      <p>Good news! Your item <strong>${itemName}</strong> has been sold.</p>
      <p><strong>Order ID:</strong> #${orderId}<br/>
         <strong>Selling Price:</strong> ${amount} RS</p>
      <p>You will receive your funds as per our payout schedule.</p>
      `
    ),
  }),

  // 11. Escrow Payment Released
  escrowReleased: (to, { amount, orderId }) => ({
    to,
    subject: `Escrow payment released – Order #${orderId}`,
    html: wrap(
      "Escrow Payment Released",
      `
      <p>Hi,</p>
      <p>Your escrow payment for order <strong>#${orderId}</strong> has been released.</p>
      <p><strong>Amount:</strong> ${amount} RS</p>
      <p>The funds are now available according to your payout method.</p>
      `
    ),
  }),
};

/**
 * DESIGNER TEMPLATES
 */
export const designerTemplates = {
  // 12. Rental Booking
  rentalBooking: (to, { productName, startDate, endDate, earnings, orderId }) => ({
    to,
    subject: `New rental booking for "${productName}" – ${BRAND_NAME}`,
    html: wrap(
      "New Rental Booking",
      `
      <p>Hi,</p>
      <p>Your design <strong>${productName}</strong> has been booked.</p>
      <p><strong>Booking dates:</strong> ${startDate} – ${endDate}<br/>
         <strong>Estimated earnings:</strong> ${earnings} RS<br/>
         <strong>Order ID:</strong> #${orderId}</p>
      `
    ),
  }),

  // 13. Custom Order Request
  customOrderRequest: (to, { customerName, details }) => ({
    to,
    subject: `New custom design request – ${BRAND_NAME}`,
    html: wrap(
      "Custom Design Request",
      `
      <p>Hi,</p>
      <p>You have received a new <strong>custom design request</strong> from <strong>${customerName}</strong>.</p>
      <p><strong>Request details:</strong></p>
      <p>${details}</p>
      `
    ),
  }),

  // 14. Designer Payment
  designerPayment: (to, { amount, period }) => ({
    to,
    subject: `Earnings payout – ${amount} RS – ${BRAND_NAME}`,
    html: wrap(
      "Designer Earnings",
      `
      <p>Hi,</p>
      <p>Your designer earnings for <strong>${period}</strong> have been processed.</p>
      <p><strong>Amount:</strong> ${amount} RS</p>
      <p>Thank you for designing with ${BRAND_NAME}.</p>
      `
    ),
  }),

  // 15. Escrow Payment Released (Designer)
  escrowReleased: (to, { amount, orderId }) => ({
    to,
    subject: `Escrow payment released – Order #${orderId}`,
    html: wrap(
      "Escrow Payment Released",
      `
      <p>Hi,</p>
      <p>Your escrow payment for order <strong>#${orderId}</strong> has been released.</p>
      <p><strong>Amount:</strong> ${amount} RS</p>
      `
    ),
  }),
};

/**
 * ADMIN / INTERNAL TEMPLATES
 */
export const adminTemplates = {
  // 16. High-Value Transaction
  highValueTransaction: (to, { amount, orderId, buyerEmail }) => ({
    to,
    subject: `ALERT: High-value transaction – ${amount} RS – Order #${orderId}`,
    html: wrap(
      "High-Value Transaction Alert",
      `
      <p>High-value transaction detected.</p>
      <p><strong>Order ID:</strong> #${orderId}<br/>
         <strong>Buyer:</strong> ${buyerEmail}<br/>
         <strong>Amount:</strong> ${amount} RS</p>
      `
    ),
  }),

  // 17. System Errors
  systemError: (to, { message, stack }) => ({
    to,
    subject: `CRITICAL: System error in ${BRAND_NAME}`,
    html: wrap(
      "System Error",
      `
      <p>A critical system error occurred.</p>
      <p><strong>Message:</strong> ${message}</p>
      ${stack ? `<pre style="background:#f3f4f6;padding:10px;border-radius:4px;">${stack}</pre>` : ""}
      `
    ),
  }),

  // 18. Suspicious Activity
  suspiciousActivity: (to, { description }) => ({
    to,
    subject: `Security alert: Suspicious activity detected – ${BRAND_NAME}`,
    html: wrap(
      "Suspicious Activity",
      `
      <p>Suspicious activity detected:</p>
      <p>${description}</p>
      `
    ),
  }),
};

/**
 * SYSTEM-WIDE / BROADCAST TEMPLATES
 */
export const systemTemplates = {
  // 19. Maintenance Alerts
  maintenanceAlert: (to, { start, end }) => ({
    to,
    subject: `Scheduled maintenance – ${BRAND_NAME}`,
    html: wrap(
      "Maintenance Notice",
      `
      <p>We will perform scheduled maintenance on:</p>
      <p><strong>${start}</strong> to <strong>${end}</strong>.</p>
      <p>During this time, some services may be unavailable.</p>
      `
    ),
  }),

  // 20. Security Breach Alert
  securityBreach: (to) => ({
    to,
    subject: `Important security update – ${BRAND_NAME}`,
    html: wrap(
      "Security Alert",
      `
      <p>We have detected a security incident affecting some user data.</p>
      <p>As a safety measure, please log in and change your password immediately.</p>
      `
    ),
  }),

  // 21. Feedback Request
  feedbackRequest: (to, { orderId }) => ({
    to,
    subject: `How was your experience? – ${BRAND_NAME}`,
    html: wrap(
      "Feedback Request",
      `
      <p>Hi,</p>
      <p>We hope you enjoyed your shopping experience with <strong>${BRAND_NAME}</strong>.</p>
      <p>If you recently placed order <strong>#${orderId}</strong>, we would love to hear your feedback.</p>
      <p>You can simply reply to this email or fill out the feedback form in your dashboard.</p>
      `
    ),
  }),
};

/**
 * AUTH TEMPLATES (New)
 */
export const authTemplates = {
  // 22. Password Reset OTP
  passwordResetOTP: (to, { otp }) => ({
    to,
    subject: `Your Password Reset Code – ${BRAND_NAME}`,
    html: wrap(
      "Password Reset",
      `
      <p>Hi,</p>
      <p>You requested a password reset. Here is your verification code:</p>
      <p style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;padding:12px 24px;background:#f3f4f6;color:#1f2937;
                     font-size:24px;letter-spacing:4px;font-weight:bold;border-radius:4px;border:1px solid #e5e7eb;">
          ${otp}
        </span>
      </p>
      <p>This code will expire in 15 minutes.</p>
      <p>If you did not request this reset, please ignore this email.</p>
      `
    ),
  }),

  // 23. Password Reset Success
  passwordResetSuccess: (to) => ({
    to,
    subject: `Password Changed Successfully – ${BRAND_NAME}`,
    html: wrap(
      "Password Changed",
      `
      <p>Hi,</p>
      <p>Your password has been successfully updated.</p>
      <p>If you did not make this change, please contact support immediately.</p>
      <p style="margin-top:20px;">
        <a href="${process.env.FRONTEND_URL || '#'}/login" 
           style="color:#16a34a;text-decoration:none;font-weight:bold;">
           Click here to login
        </a>
      </p>
      `
    ),
  }),
};


