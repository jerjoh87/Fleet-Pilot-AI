import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { appUrl, isStripeConfigured } from "@/lib/billing/customer";
import { getPublicTenant, getPublicVehicle } from "@/lib/data/public-data";

const bookingSchema = z.object({
  slug: z.string().min(1),
  vehicleId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7),
  amountCents: z.number().int().positive(),
  depositCents: z.number().int().nonnegative()
});

export async function POST(request: Request) {
  const parsed = bookingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your booking details." }, { status: 400 });
  }
  const input = parsed.data;

  const [tenant, vehicle] = await Promise.all([
    getPublicTenant(input.slug),
    getPublicVehicle(input.slug, input.vehicleId)
  ]);
  if (!tenant || !vehicle) {
    return NextResponse.json({ error: "Vehicle is no longer available." }, { status: 404 });
  }
  const configuredDepositCents = Math.round(tenant.depositFee * 100);

  // Persist a reservation when a database is configured.
  let reservationId = `pending_${Date.now()}`;
  const startsAt = new Date(`${input.startDate}T10:00:00`);
  const endsAt = new Date(`${input.endDate}T10:00:00`);
  if (isDatabaseConfigured()) {
    const org = await prisma.organization.findUnique({ where: { slug: input.slug }, select: { id: true } });
    if (!org) {
      return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
    }

    const [overlappingReservation, availabilityBlock] = await Promise.all([
      prisma.reservation.findFirst({
        where: {
          organizationId: org.id,
          vehicleId: input.vehicleId,
          status: { in: ["QUOTE", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "LATE"] },
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt }
        }
      }),
      prisma.vehicleAvailabilityBlock.findFirst({
        where: {
          organizationId: org.id,
          vehicleId: input.vehicleId,
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt }
        }
      })
    ]);

    if (overlappingReservation || availabilityBlock) {
      return NextResponse.json({ error: "This vehicle is not available for the selected dates." }, { status: 409 });
    }

    const customer = await prisma.customer.upsert({
      where: { organizationId_email: { organizationId: org.id, email: input.customerEmail } },
      update: { name: input.customerName, phone: input.customerPhone },
      create: {
        organizationId: org.id,
        name: input.customerName,
        email: input.customerEmail,
        phone: input.customerPhone
      }
    });

    const reservation = await prisma.reservation.create({
      data: {
        organizationId: org.id,
        customerId: customer.id,
        vehicleId: input.vehicleId,
        startsAt,
        endsAt,
        status: "QUOTE",
        totalCents: input.amountCents,
        depositCents: configuredDepositCents
      }
    });
    reservationId = reservation.id;
  }

  const successUrl = `${appUrl()}/${input.slug}/booking/success?reservation=${reservationId}`;
  const cancelUrl = `${appUrl()}/${input.slug}/vehicles/${input.vehicleId}`;

  // Demo mode: no Stripe key — skip straight to the confirmation screen.
  if (!isStripeConfigured()) {
    return NextResponse.json({ url: `${successUrl}&demo=1` });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.customerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: input.amountCents,
          product_data: {
            name: `${vehicle.year} ${vehicle.make} ${vehicle.model} rental`,
            description: `${input.startDate} → ${input.endDate}`
          }
        }
      },
      ...(configuredDepositCents > 0
        ? [{
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: configuredDepositCents,
              product_data: {
                name: "Refundable security deposit",
                description: "Collected with checkout and refunded after return inspection."
              }
            }
          }]
        : [])
    ],
    payment_intent_data: {
      metadata: { slug: input.slug, reservationId, kind: "public_booking" }
    },
    metadata: { slug: input.slug, reservationId, vehicleId: input.vehicleId, kind: "public_booking" },
    success_url: successUrl,
    cancel_url: cancelUrl
  });

  return NextResponse.json({ url: session.url });
}
