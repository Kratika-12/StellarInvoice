export const STROOPS_PER_XLM = 10_000_000n;

export function validateAmount(value: string): string | null {
  if (!/^\d+(\.\d{1,7})?$/.test(value.trim())) {
    return "Enter a valid XLM amount with up to 7 decimal places.";
  }
  if (Number(value) <= 0) {
    return "Amount must be greater than zero.";
  }
  return null;
}

export function xlmToStroops(value: string): bigint {
  const error = validateAmount(value);
  if (error) throw new Error(error);
  const [whole, fraction = ""] = value.trim().split(".");
  return BigInt(whole) * STROOPS_PER_XLM + BigInt(fraction.padEnd(7, "0"));
}

export function classifyWalletError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("reject") ||
    normalized.includes("declin") ||
    normalized.includes("cancel")
  ) {
    return "The wallet request was rejected. No transaction was submitted.";
  }
  if (normalized.includes("insufficient") || normalized.includes("balance")) {
    return "Your wallet does not have enough XLM for this payment and network fees.";
  }
  if (normalized.includes("not installed") || normalized.includes("not available")) {
    return "That wallet is not available in this browser. Install it or choose another wallet.";
  }
  if (
    normalized.includes("network") ||
    normalized.includes("fetch") ||
    normalized.includes("timeout")
  ) {
    return "The Stellar testnet could not be reached. Check your connection and try again.";
  }
  return message || "The wallet operation could not be completed. Please try again.";
}
