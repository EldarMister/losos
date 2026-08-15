import { EduPosApiError } from "./edu-pos.client";

export async function createOrRecoverEduPosOrder<T>(options: {
  externalOrderId: string;
  isRetry: boolean;
  create: () => Promise<T>;
  lookup: () => Promise<T>;
}): Promise<T> {
  if (options.isRetry) {
    try {
      return await options.lookup();
    } catch (lookupError) {
      const notFound = lookupError instanceof EduPosApiError && lookupError.status === 404;
      const retryable = lookupError instanceof EduPosApiError && lookupError.retryable;
      // A temporary failure in the POS lookup endpoint must not make every
      // subsequent confirmation a no-op. The create request carries the same
      // externalOrderId, so it remains the idempotent fallback for retries.
      if (!notFound && !retryable) throw lookupError;
    }
  }

  try {
    return await options.create();
  } catch (createError) {
    const recoveryDelays = [0, 250, 750];
    for (const delay of recoveryDelays) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      try {
        return await options.lookup();
      } catch (lookupError) {
        const notFound = lookupError instanceof EduPosApiError && lookupError.status === 404;
        const retryable = lookupError instanceof EduPosApiError && lookupError.retryable;
        if (!notFound && !retryable) break;
      }
    }
    throw createError;
  }
}
