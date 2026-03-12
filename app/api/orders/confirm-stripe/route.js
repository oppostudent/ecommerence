import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const { sessionId } = await request.json();

        if (!sessionId) {
            return NextResponse.json(
                { error: "Missing Stripe session id" },
                { status: 400 }
            );
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        const { metadata, payment_status, status } = session;
        const { orderIds, userId: metadataUserId, appId } = metadata || {};

        if (appId !== "gocart") {
            return NextResponse.json({ error: "Invalid app" }, { status: 400 });
        }

        if (metadataUserId !== userId) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        if (!orderIds) {
            return NextResponse.json(
                { error: "Missing order metadata" },
                { status: 400 }
            );
        }

        const orderIdsArray = orderIds
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);

        if (payment_status !== "paid" && status !== "complete") {
            return NextResponse.json({ confirmed: false, message: "Payment pending" });
        }

        await prisma.order.updateMany({
            where: { id: { in: orderIdsArray } },
            data: { isPaid: true },
        });

        await prisma.user.update({
            where: { id: userId },
            data: { cart: {} },
        });

        return NextResponse.json({ confirmed: true, message: "Stripe order confirmed" });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        );
    }
}
