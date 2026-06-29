import Link from "next/link";
type Href = Parameters<typeof Link>[0]["href"];

export const metadata = {
  title: "Privacy Policy — FleetPilot AI",
  description: "FleetPilot AI privacy policy covering data collection, use, and your rights."
};

export default function PrivacyPolicyPage() {
  const effectiveDate = "July 1, 2026";

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-sm leading-7 text-foreground">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-muted-foreground">Effective date: {effectiveDate}</p>

      <section className="mt-10 space-y-6">
        <h2 className="text-lg font-semibold">1. Introduction</h2>
        <p>
          FleetPilot AI, Inc. ("FleetPilot," "we," "us," or "our") operates the FleetPilot AI
          platform ("Platform"). This Privacy Policy explains how we collect, use, disclose, and
          protect your personal information when you use our Platform, whether as a Host, Renter,
          or visitor.
        </p>

        <h2 className="text-lg font-semibold">2. Information We Collect</h2>
        <p><strong>Information you provide directly:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Account information: full name, email address, phone number</li>
          <li>Booking information: rental dates, vehicle preferences, driver verification details</li>
          <li>Payment information: processed and stored by Stripe, Inc. — FleetPilot AI does not store credit card numbers</li>
          <li>Insurance information: insurance company name, policy number, policy holder name, expiration date, and uploaded insurance card images (when you choose to provide your own coverage)</li>
          <li>Agreement information: legal name, electronic signature, initials</li>
          <li>Host business information: business name, address, phone, fleet details</li>
          <li>Communications: messages, support requests, and feedback you send us</li>
        </ul>
        <p><strong>Information collected automatically:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Device and browser information: IP address, browser type, operating system, screen resolution</li>
          <li>Usage data: pages viewed, features used, actions taken on the Platform</li>
          <li>Agreement audit data: IP address, browser fingerprint, device type, and timestamp at the time of digital signature (collected to ensure agreement enforceability and comply with e-signature laws)</li>
        </ul>

        <h2 className="text-lg font-semibold">3. How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Process bookings, payments, security deposits, and refunds</li>
          <li>Facilitate rental agreements between Hosts and Renters</li>
          <li>Verify driver eligibility and insurance coverage</li>
          <li>Send transactional emails (booking confirmations, payment receipts, insurance notices)</li>
          <li>Provide customer support and respond to inquiries</li>
          <li>Maintain audit trails for digital signatures and agreements</li>
          <li>Detect and prevent fraud, abuse, and unauthorized access</li>
          <li>Comply with legal obligations, including tax reporting and law enforcement requests</li>
          <li>Improve and develop Platform features and services</li>
        </ul>

        <h2 className="text-lg font-semibold">4. How We Share Your Information</h2>
        <p>We share your information only as described below:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Between Hosts and Renters:</strong> When you book a vehicle, we share your name, email, and phone number with the Host. Hosts' business names and contact information are shared with Renters.</li>
          <li><strong>Payment processors:</strong> Stripe, Inc. processes all payments. See <a href="https://stripe.com/privacy" className="underline" target="_blank" rel="noopener noreferrer">Stripe's Privacy Policy</a>.</li>
          <li><strong>Insurance providers:</strong> If you purchase third-party insurance through the Platform, we share your name, email, and rental details with the selected insurance provider.</li>
          <li><strong>Email services:</strong> We use Resend to deliver transactional emails.</li>
          <li><strong>Hosting and infrastructure:</strong> Vercel (hosting), Supabase (authentication and storage).</li>
          <li><strong>Legal compliance:</strong> We may disclose information when required by law, subpoena, court order, or government request, or to protect the rights, safety, or property of FleetPilot AI, our users, or the public.</li>
        </ul>
        <p>We do not sell your personal information to third parties.</p>

        <h2 className="text-lg font-semibold">5. Data Retention</h2>
        <p>
          We retain your personal information for as long as your account is active or as needed to
          provide services. Rental agreements, signature records, and payment records are retained for
          a minimum of seven (7) years to comply with tax, legal, and regulatory requirements. You may
          request deletion of your account data at any time (see Section 7), subject to our legal
          retention obligations.
        </p>

        <h2 className="text-lg font-semibold">6. Data Security</h2>
        <p>
          We implement industry-standard security measures to protect your information, including
          encryption in transit (TLS/HTTPS), secure authentication via Supabase, PCI-compliant payment
          processing through Stripe, and access controls limiting data access to authorized personnel.
          Signature audit data (IP addresses, device fingerprints, cryptographic hashes) is stored to
          ensure the integrity and non-repudiation of digital agreements. No method of transmission or
          storage is 100% secure, and we cannot guarantee absolute security.
        </p>

        <h2 className="text-lg font-semibold">7. Your Rights</h2>
        <p><strong>All users:</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Access the personal information we hold about you</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your personal data (subject to legal retention requirements)</li>
          <li>Opt out of marketing communications</li>
        </ul>
        <p><strong>California residents (CCPA/CPRA):</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Right to know what personal information is collected, used, and disclosed</li>
          <li>Right to delete personal information</li>
          <li>Right to opt out of the sale or sharing of personal information (we do not sell your data)</li>
          <li>Right to non-discrimination for exercising your privacy rights</li>
        </ul>
        <p><strong>European residents (GDPR):</strong></p>
        <ul className="list-disc pl-6 space-y-1">
          <li>All rights listed above, plus the right to data portability and the right to restrict processing</li>
          <li>Our legal bases for processing are: contract performance (booking and payment processing), legitimate interest (fraud prevention, platform improvement), and legal obligation (tax and regulatory compliance)</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{" "}
          <a href="mailto:privacy@fleetpilot.ai" className="underline">privacy@fleetpilot.ai</a>.
          We will respond within 30 days (45 days for CCPA requests as permitted by law).
        </p>

        <h2 className="text-lg font-semibold">8. Cookies</h2>
        <p>
          The Platform uses essential cookies required for authentication and session management.
          We do not use third-party advertising or tracking cookies. Essential cookies cannot be
          disabled as they are necessary for the Platform to function.
        </p>

        <h2 className="text-lg font-semibold">9. Children's Privacy</h2>
        <p>
          The Platform is not intended for use by anyone under 18 years of age. We do not knowingly
          collect personal information from children under 18. If we discover we have collected
          information from a child under 18, we will delete it promptly.
        </p>

        <h2 className="text-lg font-semibold">10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify registered users of
          material changes via email at least 30 days before the changes take effect. The "Effective
          date" at the top of this page indicates when the policy was last revised.
        </p>

        <h2 className="text-lg font-semibold">11. Contact Us</h2>
        <p>
          For privacy questions or requests, contact us at{" "}
          <a href="mailto:privacy@fleetpilot.ai" className="underline">privacy@fleetpilot.ai</a>.
        </p>
      </section>

      <div className="mt-12 border-t pt-6 text-xs text-muted-foreground">
        <Link href={"/legal/terms" as Href} className="underline">Terms of Service</Link>
        {" · "}
        <Link href={"/" as Href} className="underline">Home</Link>
      </div>
    </main>
  );
}
