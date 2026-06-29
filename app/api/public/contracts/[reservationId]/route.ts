import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ reservationId: string }> }) {
  const { reservationId } = await params;
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase();

  if (!isDatabaseConfigured()) {
    return new Response(
      [
        "FleetPilot AI Rental Agreement",
        `Reservation: ${reservationId}`,
        "Status: Demo contract generated for customer portal review."
      ].join("\n"),
      {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "content-disposition": `attachment; filename="contract-${reservationId}.txt"`
        }
      }
    );
  }

  if (!email) {
    return new Response("Email is required to download this contract.", { status: 400 });
  }

  const reservation = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      customer: { email: { equals: email, mode: "insensitive" } }
    },
    include: {
      organization: true,
      customer: true,
      vehicle: true,
      contract: true
    }
  });

  if (!reservation) {
    return new Response("Contract not found", { status: 404 });
  }

  const body = [
    "FleetPilot AI Rental Agreement",
    `Organization: ${reservation.organization.name}`,
    `Reservation: ${reservation.id}`,
    `Customer: ${reservation.customer.name} <${reservation.customer.email}>`,
    `Vehicle: ${reservation.vehicle.year} ${reservation.vehicle.make} ${reservation.vehicle.model}`,
    `Rental Window: ${reservation.startsAt.toISOString()} to ${reservation.endsAt.toISOString()}`,
    `Total: $${(reservation.totalCents / 100).toFixed(2)}`,
    `Deposit: $${(reservation.depositCents / 100).toFixed(2)}`,
    `Signed: ${reservation.contract?.signedAt ? "Yes" : "Pending"}`
  ].join("\n");

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="contract-${reservation.id}.txt"`
    }
  });
}
