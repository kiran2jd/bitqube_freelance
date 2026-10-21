/**
 * Currency utility module for BitQube Freelance.
 * Supports primary display in US Dollars ($ USD) with automatic
 * conversion to sovereign Indian Rupees (₹ INR) for Razorpay settlement.
 */

export const USD_TO_INR_RATE = 84.0;

export interface FormattedAmount {
  usdFormatted: string;
  inrFormatted: string;
  rawUsd: number;
  rawInr: number;
  display: string;
  conversionNote: string;
}

/**
 * Converts and formats any price for primary USD ($) display
 * along with corresponding INR settlement equivalent.
 */
export function formatAmount(
  amount: number | string | undefined | null,
  currencyCode: string = "USD",
  rate: number = USD_TO_INR_RATE
): FormattedAmount {
  const numeric = Number(amount || 0);

  let rawUsd = numeric;
  let rawInr = numeric * rate;

  if (currencyCode.toUpperCase() === "INR") {
    rawInr = numeric;
    rawUsd = numeric / rate;
  }

  const usdFormatted = `$${Math.round(rawUsd).toLocaleString("en-US")}`;
  const inrFormatted = `₹${Math.round(rawInr).toLocaleString("en-IN")}`;

  return {
    usdFormatted,
    inrFormatted,
    rawUsd,
    rawInr,
    display: `${usdFormatted} USD`,
    conversionNote: `${inrFormatted} INR`,
  };
}

/**
 * Formats a budget range in USD ($) with INR settlement estimate.
 */
export function formatBudgetRange(
  budgetMin: number | string | undefined | null,
  budgetMax: number | string | undefined | null,
  currencyCode: string = "USD",
  rate: number = USD_TO_INR_RATE
): { usdRange: string; inrRange: string } {
  const max = formatAmount(budgetMax, currencyCode, rate);

  if (budgetMin !== undefined && budgetMin !== null && Number(budgetMin) > 0) {
    const min = formatAmount(budgetMin, currencyCode, rate);
    return {
      usdRange: `${min.usdFormatted} - ${max.usdFormatted}`,
      inrRange: `${min.inrFormatted} - ${max.inrFormatted}`,
    };
  }

  return {
    usdRange: `Up to ${max.usdFormatted}`,
    inrRange: `Up to ${max.inrFormatted}`,
  };
}
