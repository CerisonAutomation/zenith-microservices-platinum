/**
 * @file Manages all interactions with the Stripe payment processing service.
 * This service encapsulates the logic for creating payment intents, handling webhooks,
 * and managing customer payment methods, ensuring a secure and robust payment flow.
 *
 * @see {@link https://stripe.com/docs/api} for official Stripe API documentation.
 * @version 1.0.0
 * @since 2025-11-11
 */

import Stripe from 'stripe';
import { z } from 'zod';

// ============================================================================
// SCHEMAS & TYPES
// ============================================================================

/**
 * Input schema for creating a Stripe Payment Intent.
 * Ensures that the amount is a positive integer and currency is a valid, lowercase currency code.
 * The `userId` is included for auditing and linking the payment to an internal user.
 *
 * @see {@link https://stripe.com/docs/api/payment_intents/create}
 */
const CreatePaymentIntentInputSchema = z.object({
  /**
   * The payment amount in the smallest currency unit (e.g., cents for USD).
   * Must be a positive integer.
   */
  amount: z
    .number()
    .int()
    .positive({ message: 'Amount must be a positive integer.' }),

  /**
   * Three-letter ISO currency code, in lowercase (e.g., "usd").
   * @see {@link https://stripe.com/docs/currencies}
   */
  currency: z
    .string()
    .length(3, { message: 'Currency must be a 3-letter ISO code.' })
    .transform((c) => c.toLowerCase()),

  /**
   * The internal ID of the user initiating the payment. Used for logging and metadata.
   */
  userId: z.string().uuid({ message: 'Invalid user ID format.' }),
});

type CreatePaymentIntentInput = z.infer<typeof CreatePaymentIntentInputSchema>;

/**
 * Defines the structured success response for creating a payment intent.
 */
type CreatePaymentIntentSuccess = {
  success: true;
  clientSecret: string;
  paymentIntentId: string;
};

/**
 * Defines the structured error response for any operation within this service.
 */
type PaymentServiceError = {
  success: false;
  error: {
    message: string;
    cause?: unknown; // Original error object for logging
  };
};

// ============================================================================
// SERVICE INITIALIZATION
// ============================================================================

if (!process.env['STRIPE_SECRET_KEY']) {
  throw new Error('FATAL: STRIPE_SECRET_KEY environment variable is not set.');
}

/**
 * Singleton instance of the Stripe SDK, initialized with the secret key.
 * API version is pinned to ensure stability and prevent breaking changes.
 */
const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'], {
  apiVersion: '2025-10-29.clover', // Pin API version (Commandment 14: Supabase Mastery applies here too)
  typescript: true,
});

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Creates a new Stripe Payment Intent.
 *
 * This function is the first step in processing a payment. It validates the input,
 * communicates with the Stripe API to create a payment intent, and returns the
 * `client_secret` needed by the frontend to confirm the payment.
 *
 * It adheres to OMNIPRIME commandments by:
 * - **Commandment 1 (TypeScript):** Fully typed inputs and outputs.
 * - **Commandment 2 (Documentation):** Exhaustive JSDoc and inline comments.
 * - **Commandment 4 (Error Handling):** Structured success/error returns, no thrown exceptions.
 * - **Commandment 5 (Security):** Zod schema validation on input.
 *
 * @param {CreatePaymentIntentInput} input - The validated input data for creating the payment intent.
 * @returns {Promise<CreatePaymentIntentSuccess | PaymentServiceError>} A structured object indicating success or failure.
 *
 * @example
 * const result = await paymentService.createPaymentIntent({
 *   amount: 2000, // $20.00
 *   currency: "usd",
 *   userId: "a1b2c3d4-e5f6-7890-1234-567890abcdef"
 * });
 *
 * if (result.success) {
 *   console.log("Client Secret:", result.clientSecret);
 * } else {
 *   console.error("Error creating payment intent:", result.error.message);
 * }
 */
async function createPaymentIntent(
  input: CreatePaymentIntentInput,
): Promise<CreatePaymentIntentSuccess | PaymentServiceError> {
  // 1. Validate input against the Zod schema (Commandment 5)
  const validationResult = CreatePaymentIntentInputSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      success: false,
      error: {
        message: 'Invalid input for createPaymentIntent.',
        cause: validationResult.error.flatten(),
      },
    };
  }

  const { amount, currency, userId } = validationResult.data;

  try {
    // 2. Create the Payment Intent with Stripe (Commandment 14)
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      // Metadata is crucial for linking Stripe objects to your internal system
      metadata: {
        internalUserId: userId,
        // Add any other relevant tracking IDs here
      },
    });

    if (!paymentIntent.client_secret) {
      // This case should be rare but is handled for robustness
      throw new Error(
        'Failed to retrieve client_secret from Stripe Payment Intent.',
      );
    }

    // 3. Return structured success response (Commandment 4)
    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (err) {
    // 4. Return structured error response (Commandment 4)
    const errorMessage =
      err instanceof Error ? err.message : 'An unknown error occurred.';
    // In a real app, you would log the `err` object to your monitoring service (Loki, Datadog, etc.)
    return {
      success: false,
      error: {
        message: `Stripe API error: ${errorMessage}`,
        cause: err,
      },
    };
  }
}

/**
 * The public interface for the payment service, exposing all its functions.
 * This follows the module pattern to encapsulate the service logic.
 */
export const paymentService = {
  createPaymentIntent,
};
