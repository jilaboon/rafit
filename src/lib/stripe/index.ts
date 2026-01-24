import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// Create or retrieve Stripe customer for a RAFIT customer
export async function getOrCreateStripeCustomer(
  customerId: string,
  email: string,
  name: string,
  metadata?: Record<string, string>
): Promise<string> {
  // Search for existing customer by metadata
  const existingCustomers = await stripe.customers.search({
    query: `metadata['rafit_customer_id']:'${customerId}'`,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0].id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      rafit_customer_id: customerId,
      ...metadata,
    },
  });

  return customer.id;
}

// Create checkout session for one-time payment
export async function createCheckoutSession({
  customerId,
  priceId,
  quantity = 1,
  successUrl,
  cancelUrl,
  metadata,
}: {
  customerId: string;
  priceId: string;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    line_items: [
      {
        price: priceId,
        quantity,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });
}

// Create checkout session for subscription
export async function createSubscriptionCheckout({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  trialDays,
  metadata,
}: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: trialDays
      ? {
          trial_period_days: trialDays,
          metadata,
        }
      : { metadata },
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });
}

// Create customer portal session
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

// Cancel subscription
export async function cancelSubscription(
  subscriptionId: string,
  immediately = false
): Promise<Stripe.Subscription> {
  if (immediately) {
    return stripe.subscriptions.cancel(subscriptionId);
  }
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

// Pause subscription
export async function pauseSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    pause_collection: {
      behavior: 'void',
    },
  });
}

// Resume subscription
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    pause_collection: '',
  });
}

// Create refund
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: Stripe.RefundCreateParams.Reason
): Promise<Stripe.Refund> {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount,
    reason,
  });
}

// Verify webhook signature
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

// Get invoice PDF URL
export async function getInvoicePdfUrl(invoiceId: string): Promise<string | null> {
  const invoice = await stripe.invoices.retrieve(invoiceId);
  return invoice.invoice_pdf ?? null;
}

// Create price for membership plan
export async function createPrice({
  productName,
  amount,
  currency = 'ils',
  interval,
  metadata,
}: {
  productName: string;
  amount: number;
  currency?: string;
  interval?: 'month' | 'year';
  metadata?: Record<string, string>;
}): Promise<Stripe.Price> {
  // Create or find product
  const products = await stripe.products.search({
    query: `name:'${productName}'`,
    limit: 1,
  });

  let productId: string;
  if (products.data.length > 0) {
    productId = products.data[0].id;
  } else {
    const product = await stripe.products.create({
      name: productName,
      metadata,
    });
    productId = product.id;
  }

  // Create price
  return stripe.prices.create({
    product: productId,
    unit_amount: Math.round(amount * 100), // Convert to cents
    currency,
    ...(interval
      ? {
          recurring: {
            interval,
          },
        }
      : {}),
    metadata,
  });
}
