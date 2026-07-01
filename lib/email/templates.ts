/** All email templates. Plain-HTML strings — no React Email dependency needed. */

const base = (body: string, brandColor = "#166534") => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;padding:0;background:#f7f8fa;font-family:system-ui,-apple-system,sans-serif;color:#111827}
  .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)}
  .header{background:${brandColor};padding:28px 32px}
  .header p{margin:0;color:#fff;font-weight:700;font-size:18px}
  .body{padding:32px}
  .body h2{margin:0 0 12px;font-size:22px;font-weight:700}
  .body p{margin:0 0 16px;line-height:1.6;color:#374151}
  .box{background:#f7f8fa;border-radius:8px;padding:20px 24px;margin:20px 0}
  .box table{width:100%;border-collapse:collapse}
  .box td{padding:6px 0;font-size:14px;color:#374151}
  .box td:last-child{text-align:right;font-weight:600;color:#111827}
  .btn{display:inline-block;background:${brandColor};color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;margin:8px 0}
  .footer{padding:20px 32px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center}
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><p>FleetPilot AI</p></div>
  <div class="body">${body}</div>
  <div class="footer">Powered by FleetPilot AI &middot; <a href="https://fleetpilot.ai" style="color:#6b7280">fleetpilot.ai</a></div>
</div>
</body>
</html>`;

export type BookingConfirmationData = {
  customerName: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  totalCents: number;
  depositCents: number;
  reservationId: string;
  organizationName: string;
  brandColor?: string;
};

export function bookingConfirmationEmail(data: BookingConfirmationData) {
  const total = (data.totalCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  const deposit = (data.depositCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

  return {
    subject: `Booking confirmed — ${data.vehicleName} · ${data.organizationName}`,
    html: base(`
      <h2>Your booking is confirmed!</h2>
      <p>Hi ${data.customerName}, your reservation with <strong>${data.organizationName}</strong> is all set. Here's a summary:</p>
      <div class="box">
        <table>
          <tr><td>Vehicle</td><td>${data.vehicleName}</td></tr>
          <tr><td>Pickup</td><td>${data.startDate}</td></tr>
          <tr><td>Return</td><td>${data.endDate}</td></tr>
          <tr><td>Total charged</td><td>${total}</td></tr>
          <tr><td>Security deposit (refundable)</td><td>${deposit}</td></tr>
          <tr><td>Reservation ref.</td><td style="font-family:monospace;font-size:12px">${data.reservationId}</td></tr>
        </table>
      </div>
      <p>Your rental agreement will be sent separately before your pickup. Questions? Reply to this email.</p>
    `, data.brandColor)
  };
}

export type PaymentReceiptData = {
  customerName: string;
  amountCents: number;
  description: string;
  reservationId: string;
  organizationName: string;
  brandColor?: string;
};

export function paymentReceiptEmail(data: PaymentReceiptData) {
  const amount = (data.amountCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  return {
    subject: `Payment received — ${amount} · ${data.organizationName}`,
    html: base(`
      <h2>Payment received</h2>
      <p>Hi ${data.customerName}, we've received your payment of <strong>${amount}</strong>.</p>
      <div class="box">
        <table>
          <tr><td>Amount</td><td>${amount}</td></tr>
          <tr><td>Description</td><td>${data.description}</td></tr>
          <tr><td>Reservation</td><td style="font-family:monospace;font-size:12px">${data.reservationId}</td></tr>
        </table>
      </div>
      <p>Keep this email as your receipt. Reach out if you have any questions.</p>
    `, data.brandColor)
  };
}

export type RefundNoticeData = {
  customerName: string;
  amountCents: number;
  reason: string;
  organizationName: string;
  brandColor?: string;
};

export function refundNoticeEmail(data: RefundNoticeData) {
  const amount = (data.amountCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  return {
    subject: `Refund issued — ${amount} · ${data.organizationName}`,
    html: base(`
      <h2>Your refund is on its way</h2>
      <p>Hi ${data.customerName}, we've issued a refund of <strong>${amount}</strong> to your original payment method.</p>
      <div class="box">
        <table>
          <tr><td>Refund amount</td><td>${amount}</td></tr>
          <tr><td>Reason</td><td>${data.reason}</td></tr>
        </table>
      </div>
      <p>Refunds typically appear within 5–10 business days depending on your card issuer.</p>
    `, data.brandColor)
  };
}

export type DepositReleaseData = {
  customerName: string;
  amountCents: number;
  organizationName: string;
  brandColor?: string;
};

export function depositReleaseEmail(data: DepositReleaseData) {
  const amount = (data.amountCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  return {
    subject: `Security deposit released — ${data.organizationName}`,
    html: base(`
      <h2>Your deposit has been released</h2>
      <p>Hi ${data.customerName}, the security deposit hold of <strong>${amount}</strong> has been released back to your card. No funds were charged.</p>
      <p>Thank you for renting with <strong>${data.organizationName}</strong> — we hope to see you again!</p>
    `, data.brandColor)
  };
}

export type MaintenanceAlertData = {
  operatorName: string;
  vehicleLabel: string;
  serviceKind: string;
  dueDate: string;
  priority: string;
  organizationName: string;
};

export function maintenanceAlertEmail(data: MaintenanceAlertData) {
  const urgency = data.priority === "High" ? "⚠️ Urgent — " : "";
  return {
    subject: `${urgency}Maintenance due: ${data.serviceKind} · ${data.vehicleLabel}`,
    html: base(`
      <h2>Maintenance alert</h2>
      <p>Hi ${data.operatorName}, a service item requires your attention for <strong>${data.organizationName}</strong>:</p>
      <div class="box">
        <table>
          <tr><td>Vehicle</td><td>${data.vehicleLabel}</td></tr>
          <tr><td>Service</td><td>${data.serviceKind}</td></tr>
          <tr><td>Due date</td><td>${data.dueDate}</td></tr>
          <tr><td>Priority</td><td>${data.priority}</td></tr>
        </table>
      </div>
      <p>Log in to FleetPilot AI to schedule this service and prevent unplanned downtime.</p>
      <a class="btn" href="https://app.fleetpilot.ai/dashboard">Open dashboard</a>
    `)
  };
}

export type SubscriptionConfirmData = {
  operatorName: string;
  planName: string;
  nextBillingDate: string;
  amountCents: number;
  organizationName: string;
};

export function subscriptionConfirmEmail(data: SubscriptionConfirmData) {
  const amount = (data.amountCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  return {
    subject: `You're on the ${data.planName} plan — FleetPilot AI`,
    html: base(`
      <h2>Subscription activated</h2>
      <p>Hi ${data.operatorName}, your <strong>${data.organizationName}</strong> workspace is now on the <strong>${data.planName}</strong> plan.</p>
      <div class="box">
        <table>
          <tr><td>Plan</td><td>${data.planName}</td></tr>
          <tr><td>Monthly amount</td><td>${amount}</td></tr>
          <tr><td>Next billing date</td><td>${data.nextBillingDate}</td></tr>
        </table>
      </div>
      <p>You can manage your subscription, update your payment method, or cancel anytime from the Billing section of your dashboard.</p>
      <a class="btn" href="https://app.fleetpilot.ai/dashboard">Go to dashboard</a>
    `)
  };
}

export type InvoiceNoticeData = {
  customerName: string;
  amountCents: number;
  description: string;
  dueDate: string;
  invoiceUrl?: string;
  organizationName: string;
  brandColor?: string;
};

export function invoiceSentEmail(data: InvoiceNoticeData) {
  const amount = (data.amountCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  return {
    subject: `Invoice for ${amount} from ${data.organizationName}`,
    html: base(`
      <h2>You have a new invoice</h2>
      <p>Hi ${data.customerName}, <strong>${data.organizationName}</strong> has sent you an invoice.</p>
      <div class="box">
        <table>
          <tr><td>Description</td><td>${data.description}</td></tr>
          <tr><td>Amount due</td><td>${amount}</td></tr>
          <tr><td>Due date</td><td>${data.dueDate}</td></tr>
        </table>
      </div>
      ${data.invoiceUrl ? `<a class="btn" href="${data.invoiceUrl}">View & pay invoice</a>` : ""}
    `, data.brandColor)
  };
}

// ---------------------------------------------------------------------------
// Rental insurance notifications
// ---------------------------------------------------------------------------

export type InsurancePurchasedData = {
  customerName: string;
  organizationName: string;
  providerName: string;
  planName: string;
  coverageSummary: string;
  totalCents: number;
  policyNumber?: string;
  vehicleName: string;
  brandColor?: string;
};

export function insurancePurchasedEmail(data: InsurancePurchasedData) {
  const total = (data.totalCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  return {
    subject: `Coverage confirmed — ${data.providerName} · ${data.organizationName}`,
    html: base(`
      <h2>Your rental coverage is active</h2>
      <p>Hi ${data.customerName}, your ${data.providerName} coverage for the ${data.vehicleName} is confirmed.</p>
      <div class="box">
        <table>
          <tr><td>Provider</td><td>${data.providerName}</td></tr>
          <tr><td>Plan</td><td>${data.planName}</td></tr>
          ${data.policyNumber ? `<tr><td>Policy number</td><td>${data.policyNumber}</td></tr>` : ""}
          <tr><td>Coverage cost</td><td>${total}</td></tr>
        </table>
      </div>
      <p>${data.coverageSummary}</p>
    `, data.brandColor)
  };
}

export type InsuranceUploadData = {
  customerName: string;
  organizationName: string;
  insuranceCompany: string;
  manualApproval: boolean;
  brandColor?: string;
};

export function insuranceUploadedEmail(data: InsuranceUploadData) {
  return {
    subject: `Insurance documents received — ${data.organizationName}`,
    html: base(`
      <h2>We received your insurance documents</h2>
      <p>Hi ${data.customerName}, thanks for uploading proof of coverage from <strong>${data.insuranceCompany}</strong>.</p>
      <p>${data.manualApproval
        ? "Status: <strong>Pending review</strong> — the host will verify your documents before pickup and we'll email you when it's approved."
        : "Your coverage has been recorded. The host may reach out if any additional information is needed."}</p>
    `, data.brandColor)
  };
}

export type InsuranceDecisionData = {
  customerName: string;
  organizationName: string;
  reason?: string;
  brandColor?: string;
};

export function insuranceApprovedEmail(data: InsuranceDecisionData) {
  return {
    subject: `Insurance approved — ${data.organizationName}`,
    html: base(`
      <h2>Your insurance has been approved</h2>
      <p>Hi ${data.customerName}, your uploaded insurance has been verified and approved by ${data.organizationName}. You're all set for pickup.</p>
    `, data.brandColor)
  };
}

export function insuranceRejectedEmail(data: InsuranceDecisionData) {
  return {
    subject: `Action needed: insurance not approved — ${data.organizationName}`,
    html: base(`
      <h2>Your insurance could not be approved</h2>
      <p>Hi ${data.customerName}, unfortunately ${data.organizationName} was unable to approve your uploaded insurance.</p>
      ${data.reason ? `<div class="box"><table><tr><td>Reason</td><td>${data.reason}</td></tr></table></div>` : ""}
      <p>Please purchase coverage at checkout or upload a valid policy to keep your reservation.</p>
    `, data.brandColor)
  };
}

export function insuranceMoreInfoEmail(data: InsuranceDecisionData) {
  return {
    subject: `More information needed for your insurance — ${data.organizationName}`,
    html: base(`
      <h2>We need a bit more information</h2>
      <p>Hi ${data.customerName}, ${data.organizationName} needs additional details to verify your insurance.</p>
      ${data.reason ? `<div class="box"><table><tr><td>Requested</td><td>${data.reason}</td></tr></table></div>` : ""}
      <p>Please reply with the requested documents so we can finalize your reservation.</p>
    `, data.brandColor)
  };
}

export type BookingReviewData = {
  organizationName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  reservationId: string;
  dashboardUrl: string;
  brandColor?: string;
};

/** Sent to the HOST when a renter books and uploads their ID for approval. */
export function bookingReviewEmail(data: BookingReviewData) {
  return {
    subject: `New booking to review — ${data.vehicleName} · ${data.customerName}`,
    html: base(`
      <h2>A renter needs your approval</h2>
      <p><strong>${data.customerName}</strong> just booked and uploaded a government-issued ID. Review the ID and approve or reject the reservation from your dashboard.</p>
      <div class="box">
        <table>
          <tr><td>Vehicle</td><td>${data.vehicleName}</td></tr>
          <tr><td>Pickup</td><td>${data.startDate}</td></tr>
          <tr><td>Return</td><td>${data.endDate}</td></tr>
          <tr><td>Renter</td><td>${data.customerName}</td></tr>
          <tr><td>Email</td><td>${data.customerEmail}</td></tr>
          <tr><td>Phone</td><td>${data.customerPhone}</td></tr>
          <tr><td>Reservation ref.</td><td style="font-family:monospace;font-size:12px">${data.reservationId}</td></tr>
        </table>
      </div>
      <a class="btn" href="${data.dashboardUrl}">Review booking</a>
    `, data.brandColor)
  };
}
