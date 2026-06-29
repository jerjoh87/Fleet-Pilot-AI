import { requireAppSession } from "@/lib/auth/session";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  const session = await requireAppSession();
  const { reservationId } = await params;

  if (!isDatabaseConfigured()) {
    return new Response(
      [
        "FleetPilot AI Rental Agreement",
        `Organization: ${session.organization.name}`,
        `Reservation: ${reservationId}`,
        "Status: Demo contract generated for local review."
      ].join("\n"),
      {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "content-disposition": `inline; filename=\"contract-${reservationId}.txt\"`
        }
      }
    );
  }

  const reservation = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      organizationId: session.organization.id
    },
    include: {
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
    `Organization: ${session.organization.name}`,
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
      "content-disposition": `inline; filename=\"contract-${reservation.id}.txt\"`
    }
  });
}
