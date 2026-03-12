import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");

    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    const finalizeFromMetadata = async (metadata, isPaid) => {
      const { orderIds, userId, appId } = metadata || {};

      if (appId !== "gocart") {
        console.log("Stripe webhook ignored: invalid appId");
        return;
      }

      if (!orderIds || !userId) {
        console.log("Stripe webhook ignored: missing metadata", metadata);
        return;
      }

      const orderIdsArray = orderIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      if (orderIdsArray.length === 0) {
        console.log("Stripe webhook ignored: no orderIds", metadata);
        return;
      }

      if (isPaid) {
        await prisma.order.updateMany({
          where: { id: { in: orderIdsArray } },
          data: { isPaid: true },
        });

        await prisma.user.update({
          where: { id: userId },
          data: { cart: {} },
        });
      } else {
        await prisma.order.deleteMany({
          where: {
            id: { in: orderIdsArray },
            isPaid: false,
          },
        });
      }
    };

    const handleCheckoutSession = async (sessionId, isPaid) => {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      await finalizeFromMetadata(session.metadata, isPaid);
    };

    const handlePaymentIntent = async (paymentIntentId, isPaid) => {
      const sessions = await stripe.checkout.sessions.list({
        payment_intent: paymentIntentId,
        limit: 1,
      });

      if (!sessions.data.length) {
        console.log("Stripe webhook ignored: no checkout session for payment intent", paymentIntentId);
        return;
      }

      await finalizeFromMetadata(sessions.data[0].metadata, isPaid);
    };

    console.log("Stripe webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.payment_status === "paid") {
          await handleCheckoutSession(session.id, true);
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object;
        await handleCheckoutSession(session.id, false);
        break;
      }
      case "payment_intent.succeeded": {
        await handlePaymentIntent(event.data.object.id, true);
        break;
      }
      case "payment_intent.canceled": {
        await handlePaymentIntent(event.data.object.id, false);
        break;
      }
      default:
        console.log("Unhandled event type", event.type);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}