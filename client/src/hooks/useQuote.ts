import { useEffect, useState } from "react";
import { getQuote, TokenInfo } from "@/lib/utils";

type UseQuoteParams = {
  fromToken: TokenInfo | null;
  toToken: TokenInfo | null;
  amount: string;
  slippage: number;
  disabled?: boolean;
};

export function useQuote({
  fromToken,
  toToken,
  amount,
  slippage,
  disabled = false,
}: UseQuoteParams) {
  const [quote, setQuote] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const isSameToken =
    !!fromToken &&
    !!toToken &&
    fromToken.id === toToken.id;

  useEffect(() => {
    // ---------- Guards ----------
    if (
      disabled ||
      !fromToken ||
      !toToken ||
      isSameToken ||
      !amount ||
      Number(amount) <= 0
    ) {
      setQuote(null);
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);

    const id = setTimeout(async () => {
      try {
        const q = await getQuote(
          fromToken,
          toToken,
          Number(amount),
          slippage
        );

        if (cancelled) return;

        setQuote(q);
        setError("");
      } catch (e) {
        if (!cancelled) {
          setQuote(null);
          setError("Failed to fetch quote");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 400); // debounce

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [fromToken, toToken, amount, slippage, disabled, isSameToken]);

  return {
    quote,
    loading,
    error,
    isSameToken,
  };
}
