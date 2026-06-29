import Link from "next/link";
type Href = Parameters<typeof Link>[0]["href"];

export const metadata = {
  title: "Terms of Service — FleetPilot AI",
  description: "FleetPilot AI platform terms of service for hosts and renters."
};

export default function TermsOfServicePage() {
  const effectiveDate = "July 1, 2026";

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-sm leading-7 text-foreground">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-muted-foreground">Effective date: {effectiveDate}</p>

      <section className="mt-10 space-y-6">
        <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
        <p>
          By accessing or using the FleetPilot AI platform ("Platform"), operated by FleetPilot AI, Inc.
          ("FleetPilot," "we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms").
          If you do not agree to these Terms, do not use the Platform.
        </p>

        <h2 className="text-lg font-semibold">2. Platform Role — Marketplace Intermediary</h2>
        <p>
          FleetPilot AI is a technology platform that connects vehicle owners ("Hosts") with individuals
          seeking to rent vehicles ("Renters"). <strong>FleetPilot AI is not a party to any rental
          transaction between a Host and a Renter.</strong> We do not own, manage, maintain, inspect,
          insure, or control any vehicle listed on the Platform. We do not employ any Host or Renter.
          All rental agreements are between the Host and the Renter directly. FleetPilot AI acts solely
          as a marketplace intermediary facilitating the connection, payment processing, and digital
          agreement signing between the parties.
        </p>

        <h2 className="text-lg font-semibold">3. Eligibility</h2>
        <p>
          You must be at least 21 years of age, hold a valid driver's license issued in the country
          where the rental occurs, and have the legal capacity to enter binding agreements to use the
          Platform as a Renter. Hosts must be at least 18 years of age and the legal owner or authorized
          operator of any vehicle listed. You represent that all information you provide is accurate,
          current, and complete.
        </p>

        <h2 className="text-lg font-semibold">4. Host Responsibilities</h2>
        <p>
          Hosts are solely responsible for: (a) ensuring their vehicles are roadworthy, legally
          registered, properly insured, and meet all applicable safety standards; (b) the accuracy of
          all vehicle listings, descriptions, photos, pricing, and availability; (c) compliance with
          all federal, state, and local laws governing vehicle rentals, including any required permits
          or licenses; (d) maintaining appropriate commercial or peer-to-peer vehicle-sharing insurance
          coverage; (e) collecting and verifying renter identity, age, and license information before
          vehicle handoff; and (f) reporting and resolving any incidents, accidents, or damage claims.
        </p>

        <h2 className="text-lg font-semibold">5. Renter Responsibilities</h2>
        <p>
          Renters are solely responsible for: (a) operating the vehicle lawfully, safely, and only
          during the confirmed reservation period; (b) maintaining valid insurance coverage as required
          by the rental agreement and applicable law; (c) reporting any accidents, damage, theft, or
          mechanical issues to the Host immediately; (d) returning the vehicle on time and in the same
          condition as received; (e) all tolls, citations, parking tickets, fuel, cleaning charges,
          and other costs incurred during the rental period; and (f) paying all amounts owed under the
          rental agreement, including damage charges.
        </p>

        <h2 className="text-lg font-semibold">6. No Warranty — Vehicle Condition</h2>
        <p>
          FleetPilot AI makes no representations or warranties regarding the condition, safety,
          roadworthiness, legality, or suitability of any vehicle listed on the Platform. Vehicles are
          provided by independent Hosts "as is" and "as available." FleetPilot AI does not inspect
          vehicles, verify Host claims, or guarantee that any vehicle meets any standard of quality,
          fitness, or safety. You use any vehicle at your own risk.
        </p>

        <h2 className="text-lg font-semibold">7. Insurance Disclaimer</h2>
        <p>
          FleetPilot AI is not an insurance company, insurance broker, or licensed insurance agent.
          Any insurance or protection products presented through the Platform are offered by independent
          third-party insurance providers. FleetPilot AI does not underwrite, administer, adjust, or
          guarantee any insurance policy or claim. Coverage is subject to the terms, conditions,
          exclusions, and limitations of the applicable policy. You should review the full policy
          documents before purchasing coverage. FleetPilot AI is not responsible for any denied claims,
          coverage gaps, or disputes with insurance providers.
        </p>

        <h2 className="text-lg font-semibold">8. Fees and Payment</h2>
        <p>
          FleetPilot AI charges a platform service fee on each rental transaction. This fee is disclosed
          during the checkout process. All payments are processed securely by Stripe, Inc. FleetPilot AI
          does not store credit card numbers. Security deposits are authorized or collected as disclosed
          at booking and are refunded after vehicle return inspection, less any approved charges.
          Cancellation and refund terms are set by each Host and disclosed during booking.
        </p>

        <h2 className="text-lg font-semibold">9. Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless FleetPilot AI, its officers, directors,
          employees, agents, and affiliates from and against any and all claims, damages, losses,
          liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or
          related to: (a) your use of the Platform; (b) any rental transaction you participate in;
          (c) your violation of these Terms or any applicable law; (d) your vehicle listing or rental
          of any vehicle; (e) any personal injury, property damage, or death arising from a rental
          transaction; (f) any dispute between a Host and a Renter; or (g) your violation of any
          third party's rights.
        </p>

        <h2 className="text-lg font-semibold">10. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, FLEETPILOT AI SHALL NOT BE LIABLE FOR ANY INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS
          OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION
          WITH YOUR USE OF THE PLATFORM OR ANY RENTAL TRANSACTION, WHETHER BASED ON WARRANTY, CONTRACT,
          TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR ANY OTHER LEGAL THEORY, EVEN IF FLEETPILOT
          AI HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p>
          IN NO EVENT SHALL FLEETPILOT AI'S TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING
          OUT OF OR RELATING TO THE PLATFORM OR THESE TERMS EXCEED THE GREATER OF (A) THE TOTAL
          PLATFORM SERVICE FEES PAID BY YOU TO FLEETPILOT AI IN THE TWELVE (12) MONTHS PRECEDING THE
          CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS ($100.00).
        </p>

        <h2 className="text-lg font-semibold">11. Dispute Resolution and Arbitration</h2>
        <p>
          Any dispute, claim, or controversy arising out of or relating to these Terms or your use of
          the Platform shall be resolved by binding arbitration administered by the American Arbitration
          Association ("AAA") under its Consumer Arbitration Rules. Arbitration shall take place in the
          state where FleetPilot AI maintains its principal place of business, or remotely as permitted
          by the AAA rules. The arbitrator's decision shall be final and binding. <strong>You agree to
          waive any right to participate in a class action, class arbitration, or representative
          proceeding.</strong> Each party shall bear its own costs, except as otherwise required by
          applicable law or the AAA rules.
        </p>

        <h2 className="text-lg font-semibold">12. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the State of
          Delaware, without regard to its conflict of law provisions. Where arbitration does not apply,
          you consent to the exclusive jurisdiction and venue of the state and federal courts located in
          Delaware.
        </p>

        <h2 className="text-lg font-semibold">13. Assumption of Risk</h2>
        <p>
          You acknowledge that renting or listing a vehicle involves inherent risks, including but not
          limited to the risk of vehicle accidents, personal injury, death, property damage, theft,
          mechanical failure, and financial loss. You voluntarily assume all such risks and release
          FleetPilot AI from any claims related to these risks to the fullest extent permitted by law.
        </p>

        <h2 className="text-lg font-semibold">14. Account Termination</h2>
        <p>
          FleetPilot AI may suspend or terminate your access to the Platform at any time, with or
          without cause, and with or without notice. Upon termination, your right to use the Platform
          ceases immediately. Provisions that by their nature should survive termination shall survive,
          including indemnification, limitation of liability, and dispute resolution.
        </p>

        <h2 className="text-lg font-semibold">15. Modifications</h2>
        <p>
          We may update these Terms from time to time. We will notify registered users of material
          changes via email or Platform notification at least 30 days before the changes take effect.
          Continued use of the Platform after the effective date constitutes acceptance of the revised
          Terms.
        </p>

        <h2 className="text-lg font-semibold">16. Severability</h2>
        <p>
          If any provision of these Terms is found to be unenforceable, the remaining provisions
          shall continue in full force and effect. The unenforceable provision shall be modified to
          the minimum extent necessary to make it enforceable while preserving its intent.
        </p>

        <h2 className="text-lg font-semibold">17. Contact</h2>
        <p>
          Questions about these Terms should be sent to{" "}
          <a href="mailto:legal@fleetpilot.ai" className="underline">legal@fleetpilot.ai</a>.
        </p>
      </section>

      <div className="mt-12 border-t pt-6 text-xs text-muted-foreground">
        <Link href={"/legal/privacy" as Href} className="underline">Privacy Policy</Link>
        {" · "}
        <Link href={"/" as Href} className="underline">Home</Link>
      </div>
    </main>
  );
}
