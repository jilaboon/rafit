import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import prisma from '@/lib/db';
import { constructWebhookEvent } from '@/lib/stripe';
import { createAuditLog } from '@/lib/security/audit';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

// Idempotency check
async function isEventProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.auditLog.findFirst({
    where: {
      action: 'stripe.webhook',
      metadata: {
        path: ['eventId'],
        equals: eventId,
      },
    },
  });
  return !!existing;
}

async function markEventProcessed(
  eventId: string,
  eventType: string,
  metadata: Record<string, unknown>
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: 'stripe.webhook',
      entityType: 'stripe_event',
      entityId: eventId,
      metadata: {
        eventId,
        eventType,
        ...metadata,
      },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature, WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Idempotency check
    if (await isEventProcessed(event.id)) {
      console.warn(`Event ${event.id} already processed, skipping`);
      return NextResponse.json({ received: true, skipped: true });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }

      default:
        console.warn(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await markEventProcessed(event.id, event.type, {
      objectId: (event.data.object as { id: string }).id,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { customer, metadata, mode, subscription } = session;

  if (!metadata?.rafit_customer_id || !metadata?.rafit_plan_id) {
    console.warn('Missing RAFIT metadata in checkout session');
    return;
  }

  const customerId = metadata.rafit_customer_id;
  const planId = metadata.rafit_plan_id;
  const tenantId = metadata.rafit_tenant_id;

  // Update customer with Stripe customer ID
  await prisma.customer.update({
    where: { id: customerId },
    data: { stripeCustomerId: customer as string },
  });

  if (mode === 'subscription' && subscription) {
    // Subscription handled by subscription.created event
    return;
  }

  // One-time payment - create membership
  const plan = await prisma.membershipPlan.findUnique({
    where: { id: planId },
  });

  if (plan) {
    await prisma.membership.create({
      data: {
        customerId,
        planId,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: plan.validDays
          ? new Date(Date.now() + plan.validDays * 24 * 60 * 60 * 1000)
          : null,
        sessionsRemaining: plan.sessions,
        creditsRemaining: plan.credits,
        autoRenew: false,
      },
    });

    await createAuditLog({
      tenantId,
      action: 'membership.create',
      entityType: 'membership',
      entityId: customerId,
      newValues: { planId, source: 'stripe_checkout' },
    });
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const { metadata } = subscription;

  if (!metadata?.rafit_customer_id || !metadata?.rafit_plan_id) {
    return;
  }

  const customerId = metadata.rafit_customer_id;
  const planId = metadata.rafit_plan_id;
  const tenantId = metadata.rafit_tenant_id;

  // Create membership
  await prisma.membership.create({
    data: {
      customerId,
      planId,
      status: 'ACTIVE',
      startDate: new Date(subscription.current_period_start * 1000),
      endDate: new Date(subscription.current_period_end * 1000),
      stripeSubscriptionId: subscription.id,
      autoRenew: true,
    },
  });

  await createAuditLog({
    tenantId,
    action: 'membership.create',
    entityType: 'membership',
    entityId: customerId,
    newValues: {
      planId,
      stripeSubscriptionId: subscription.id,
      source: 'stripe_subscription',
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const membership = await prisma.membership.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!membership) return;

  const newStatus =
    subscription.status === 'active'
      ? 'ACTIVE'
      : subscription.status === 'paused'
        ? 'PAUSED'
        : subscription.status === 'canceled'
          ? 'CANCELLED'
          : membership.status;

  await prisma.membership.update({
    where: { id: membership.id },
    data: {
      status: newStatus,
      endDate: new Date(subscription.current_period_end * 1000),
      autoRenew: !subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const membership = await prisma.membership.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!membership) return;

  await prisma.membership.update({
    where: { id: membership.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      autoRenew: false,
    },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.customer || !invoice.subscription) return;

  // Extend membership period
  const membership = await prisma.membership.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string },
  });

  if (membership) {
    await prisma.membership.update({
      where: { id: membership.id },
      data: {
        endDate: new Date((invoice.lines.data[0]?.period?.end || 0) * 1000),
      },
    });
  }

  // Record payment
  const customer = await prisma.customer.findFirst({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (customer) {
    await prisma.payment.create({
      data: {
        customerId: customer.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'COMPLETED',
        description: `חיוב מנוי - ${invoice.lines.data[0]?.description || 'מנוי'}`,
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId: invoice.payment_intent as string,
      },
    });
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customer = await prisma.customer.findFirst({
    where: { stripeCustomerId: invoice.customer as string },
  });

  if (customer) {
    await prisma.payment.create({
      data: {
        customerId: customer.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        status: 'FAILED',
        description: `חיוב נכשל - ${invoice.lines.data[0]?.description || 'מנוי'}`,
        stripeInvoiceId: invoice.id,
      },
    });

    // TODO: Send dunning email
    // TODO: Create notification job
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Payment recording handled by invoice.paid for subscriptions
  // This handles one-time payments
  const customer = await prisma.customer.findFirst({
    where: { stripeCustomerId: paymentIntent.customer as string },
  });

  if (!customer) return;

  // Check if already recorded
  const existingPayment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (existingPayment) return;

  await prisma.payment.create({
    data: {
      customerId: customer.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      status: 'COMPLETED',
      description: paymentIntent.description || 'תשלום',
      stripePaymentIntentId: paymentIntent.id,
    },
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: charge.payment_intent as string },
  });

  if (!payment) return;

  const refundedAmount = charge.amount_refunded / 100;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status:
        refundedAmount >= Number(payment.amount)
          ? 'REFUNDED'
          : 'PARTIALLY_REFUNDED',
      refundedAmount,
    },
  });

  await createAuditLog({
    action: 'payment.refund',
    entityType: 'payment',
    entityId: payment.id,
    newValues: { refundedAmount },
  });
}
