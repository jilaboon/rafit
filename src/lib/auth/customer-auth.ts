import { auth } from './config';
import { AuthError } from './permissions';

/**
 * Require customer authentication for portal API routes.
 * Throws AuthError if not a customer.
 */
export async function requireCustomerAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new AuthError('Unauthorized', 401);
  }
  if (!session.user.isCustomer || !session.user.customerId || !session.user.customerTenantId) {
    throw new AuthError('Customer access required', 403);
  }
  return session as typeof session & {
    user: typeof session.user & {
      isCustomer: true;
      customerId: string;
      customerTenantId: string;
    };
  };
}

/**
 * Get customer session without throwing.
 * Returns null if not authenticated or not a customer.
 */
export async function getCustomerSession() {
  try {
    return await requireCustomerAuth();
  } catch {
    return null;
  }
}
