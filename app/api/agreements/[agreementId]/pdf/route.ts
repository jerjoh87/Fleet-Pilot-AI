import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { renderAgreementPdf } from "@/lib/agreements/pdf";
import { getAppSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ agreementId: string }> }) {
  const { agreementId } = await context.params;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  const agreement = await prisma.rentalAgreement.findUnique({
    where: { id: agreementId },
    include: {
      customer: true,
      reservation: { include: { vehicle: true, organization: true } },
      template: true,
      certificate: true,
      signatureLogs: { orderBy: { createdAt: "asc" } }
    }
  });

  if (!agreement) {
    return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
  }

  // Only the organization owner/staff or the signing customer (via email token) can access.
  const session = await getAppSession();
  const tokenEmail = new URL(request.url).searchParams.get("email");
  const isOrgMember = session && session.organization.id === agreement.organizationId;
  const isSigningCustomer = tokenEmail && tokenEmail === agreement.customer.email;
  if (!isOrgMember && !isSigningCustomer) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { reservation, customer, template } = agreement;
  const vehicle = reservation.vehicle;
  const lines = [
    "FleetPilot AI Digital Rental Agreement",
    "",
    `Business: ${reservation.organization.name}`,
    template?.businessAddress ? `Business Address: ${template.businessAddress}` : "",
    template?.phone ? `Phone: ${template.phone}` : "",
    template?.email ? `Email: ${template.email}` : "",
    "",
    `Agreement ID: ${agreement.id}`,
    `Agreement Version: ${agreement.version}`,
    `Reservation ID: ${reservation.id}`,
    `Status: ${agreement.status}`,
    "",
    "Customer Information",
    `Name: ${customer.name}`,
    `Email: ${customer.email}`,
    `Phone: ${customer.phone ?? ""}`,
    "",
    "Vehicle Information",
    `Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    `Pickup: ${reservation.startsAt.toISOString()}`,
    `Return: ${reservation.endsAt.toISOString()}`,
    `Rental Total: $${(reservation.totalCents / 100).toFixed(2)}`,
    `Security Deposit: $${(reservation.depositCents / 100).toFixed(2)}`,
    "",
    "Rental Terms",
    ...(template ? [
      `Terms & Conditions: ${template.terms}`,
      `Mileage Policy: ${template.mileagePolicy}`,
      `Fuel Policy: ${template.fuelPolicy}`,
      `Smoking Policy: ${template.smokingPolicy}`,
      `Pet Policy: ${template.petPolicy}`,
      `Late Return Policy: ${template.lateReturnPolicy}`,
      `Cleaning Fee: ${template.cleaningFee}`,
      `Damage Policy: ${template.damagePolicy}`,
      `Insurance Terms: ${template.insuranceTerms}`,
      `Roadside Assistance: ${template.roadsideAssistance}`,
      `Security Deposit: ${template.securityDeposit}`,
      `Cancellation Policy: ${template.cancellationPolicy}`,
      `Prohibited Uses: ${template.prohibitedUses}`,
      `State-Specific Legal Clauses: ${template.stateClauses}`,
      `Digital Signature Disclosure: ${template.signatureDisclosure}`
    ] : ["Default agreement terms were accepted at booking."]),
    "",
    "Electronic Signature Certificate",
    `Signer Legal Name: ${agreement.legalName}`,
    `Signature Method: ${agreement.signatureMethod}`,
    `Signed At: ${agreement.agreedAt.toISOString()}`,
    `IP Address: ${agreement.ipAddress ?? ""}`,
    `Browser/Device: ${agreement.device ?? agreement.userAgent ?? ""}`,
    `Certificate Number: ${agreement.certificate?.certificateNumber ?? ""}`,
    `Signature Hash: ${agreement.certificate?.signatureHash ?? ""}`,
    "",
    "Signature Log",
    ...agreement.signatureLogs.map((log) => `${log.createdAt.toISOString()} - ${log.event} - ${log.signatureMethod} - ${log.ipAddress ?? ""}`)
  ].filter((line) => line !== "");

  const pdf = renderAgreementPdf(lines);
  return new NextResponse(pdf, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="rental-agreement-${agreement.id}.pdf"`
    }
  });
}
