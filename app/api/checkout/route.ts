import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";

const checkoutSchema = z.object({
  organizationId: z.string().min(1),
  reservationId: z.string().min(1),
  amount: z.number().int().positive(),
  customerEmail: z.string().email(),
  description: z.string().min(1)
});

export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: parsed.data.customerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: parsed.data.amount,
          product_data: {
            name: parsed.data.description
          }
        }
      }
    ],
    payment_intent_data: {
      metadata: {
        organizationId: parsed.data.organizationId,
        reservationId: parsed.data.reservationId,
        kind: "checkout"
      }
    },
    metadata: {
      organizationId: parsed.data.organizationId,
      reservationId: parsed.data.reservationId,
      kind: "checkout"
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard?checkout=cancelled`
  });

  return NextResponse.json({ url: session.url });
}
