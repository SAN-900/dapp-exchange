import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect} from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { executeSwap, fetchEarnTokens, getTokenBalance, TokenInfo } from '@/lib/utils';
import TokenSelector from './tokenSelector';
import LazyTokenImage from '../lazy_image_loading';
import { useQuote } from '@/hooks/useQuote';

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SAFE_SOL_FEE = 0.01;

export default function ExchangeFrame() {
    const wallet = useWallet();
    const {connection} = useConnection();

    const [pageLoading, setPageLoading] = useState(false);
    const [swapLoading, setSwapLoading] = useState(false)

    const [tokenList, setTokenList] = useState<TokenInfo[]>([]);

    const [selectingSide, setSelectingSide] = useState<"from" | "to" | null>(null);


    const [fromToken, setFromToken] = useState<TokenInfo | null>(null);
    const [toToken, setToToken] = useState<TokenInfo | null>(null);

    const [fromAmount, setFromAmount] = useState("");
    const [toAmount, setToAmount] = useState("");

    const [walletBalance, setWalletBalance] = useState(0);
    const [slippage, setSlippage] = useState(0.5);
    const [error, setError] = useState("");

    const [halfClicked, setHalfClicked] = useState(false);
    const [maxClicked, setMaxClicked] = useState(false);

    const [selectorOpen, setSelectorOpen] = useState(false);
    const {quote, loading: quoteLoading, error: quoteError, isSameToken}= useQuote({fromToken, toToken, amount: fromAmount, slippage});

    // Load default tokens on mount
    useEffect(() => {
    const loadDefaultTokens = async () => {
      try {
        const tokens = await fetchEarnTokens();
        setTokenList(tokens);
        const sol = tokens.find((t) => t.id === SOL_MINT);
        const usdc = tokens.find((t) => t.id === USDC_MINT);

        if (!sol || !usdc) {
          throw new Error("Default tokens not found");
        }

        setFromToken(sol);
        setToToken(usdc);
      } catch (error) {
        console.error("Error loading tokens:", error);
        setError("Failed to load tokens. Please try refreshing the page.");
      }
    };

    loadDefaultTokens();
  }, []);

  // Fetch wallet balance
  useEffect(() => {
      if (!wallet.publicKey || !fromToken) return;

      let cancelled = false;
      (async () => {
          try {
            const bal = await getTokenBalance(
              connection,
              wallet.publicKey!,
              fromToken
            );
            if (!cancelled) setWalletBalance(bal);
          } catch (e) {
            console.error("Balance fetch failed", e);
            if (!cancelled) setWalletBalance(0);
          }
        })();

      return () => {
        cancelled = true;
      };
    }, [wallet.publicKey, fromToken, connection]);

  const usableBalance = fromToken?.id === SOL_MINT? Math.max(walletBalance - SAFE_SOL_FEE, 0): walletBalance;
  const insufficientBalance = Number(fromAmount) > usableBalance;

  

  const halfBalance = () => {
    setFromAmount((usableBalance / 2).toFixed(6));
    setHalfClicked(true);
    setMaxClicked(false);
    setError("");
  }

  const maxBalance = () => {
    setFromAmount((usableBalance.toFixed(6)));
    setMaxClicked(true);
    setHalfClicked(false);
    setError("");
  } 

  // swap tokens from to to
  const handelSwapTokens = () => {
    if(!fromToken || !toToken) return;

    setFromToken(toToken);
    setToToken(fromToken);

    setFromAmount(toAmount);

    setError("");
  }

      // Quote fetch
  useEffect(() => {
      if (!quote || !toToken) {
        setToAmount("");
        return;
      }
      if(quoteError) {
        setError(quoteError);
        setToAmount("");
        return;
      }
      setToAmount(
        (Number(quote.outAmount) / 10 ** toToken.decimals).toString()
      );
    }, [toToken, quote]);

  // Swap
  const handleSwap = async () => {
    if(!fromToken || !toToken) {
      setError("Please select both tokens");
      return;
    }
    try{
      setSwapLoading(true);
      setError("");
      const txid = await executeSwap(quote,  connection, wallet);
      console.log("Swap transaction ID:", txid);
    } catch(error) {
      console.error("Error executing swap:", error);
      setError("Failed to execute swap. Please try again later.");
    } finally{
      setSwapLoading(false);
      setFromAmount("");
      setError("");
    }
  }
  if(pageLoading){
    return <div className="flex h-full w-full items-center justify-center">Loading...</div>;
  }
  return (
    <div className="flex h-full w-full items-center justify-center shadow-2xl">
      <div className="w-full min-w-96 rounded-lg bg-amber-50 dark:bg-neutral-900 p-4 dark:text-white text-gray-700">

        {/* Header */}
        <div className="mb-4 flex justify-between">
          <h1 className="text-xl font-semibold">Exchange your credits</h1>
          
        </div>

        {/* SELL */}
        <div className="rounded-lg dark:bg-blue-950 p-4 items-center-safe border-2 hover:border-b-cyan-500">
          <div className="flex justify-between text-xs mb-4 font-semibold">
            <div>Sell</div>
              <div className="flex justify-between gap-2">
                  Balance: {usableBalance.toFixed(6)} {fromToken?.symbol}
                {fromToken?.id === SOL_MINT? <div className="flex gap-1">
                  <Button className={`bg-transparent border-2 text-gray-700 dark:text-amber-50 hover:bg-teal-200 dark:hover:bg-amber-700 ${halfClicked ? 'bg-teal-200 dark:!bg-amber-700' : ''}`} size="xs" onClick={halfBalance}>Half</Button>
                  <Button className={`bg-transparent border-2 text-gray-700 dark:text-amber-50 hover:bg-teal-200 dark:hover:bg-amber-700 ${maxClicked ? 'bg-teal-200 dark:!bg-amber-700' : ''}`} size="xs" onClick={maxBalance}>Max</Button>
                </div>: null}
            </div>
          </div>

            <div className="flex justify-between items-center gap-2">
             <TokenSelector
              open={selectorOpen}
              onClose={() => setSelectorOpen(false)}
              tokens={tokenList}
              selectedToken={selectingSide === "from" ? fromToken : toToken}
              onSelect={(token) => {
                if (selectingSide === "from") setFromToken(token);
                if (selectingSide === "to") setToToken(token);
              }}
            />
            <button
            onClick={() => { setSelectingSide("from"); setSelectorOpen(true); }}
            className="flex items-center gap-2 rounded-xl border px-3 py-2 hover:border-teal-600 dark:bg-neutral-900"
          >
            <LazyTokenImage
              src={fromToken?.icon}
              alt={fromToken?.symbol}
            />
            <span className="font-semibold text-gray-700 dark:text-white">
              {fromToken?.symbol}
            </span>
          </button>
              <Input
                value={fromAmount}
                onChange={(e) => {setFromAmount(e.target.value); setHalfClicked(false); setMaxClicked(false);}}
                className="w-32 font-bold text-right hover:border-teal-600 focus:border-teal-600"
                placeholder="0.0"
              />
            </div>
        </div>
        <div className="flex items-center justify-center">
             <button
                onClick={handelSwapTokens}
                className="
                  group h-10 w-10 rounded-full
                  border border-blue-500/60
                  text-blue-400
                  flex items-center justify-center
                  dark:bg-neutral-900
                  hover:bg-blue-500/10
                  hover:shadow-[0_0_12px_rgba(59,130,246,0.6)]
                  transition-all duration-300
                "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="w-5 h-5 transition-transform duration-300 group-hover:rotate-180"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7l4-4 4 4M12 3v14M16 17l-4 4-4-4"
                  />
                </svg>
              </button> 
        </div>

        {/* BUY */}
        <div className="rounded-lg dark:bg-slate-800 p-4 mb-4 border-2 hover:border-b-slate-500 font-semibold">
          <span className="text-xs mb-4 flex">Buy</span>
         <div className="flex justify-between items-center gap-2">
            <button
            onClick={() => { setSelectingSide("to"); setSelectorOpen(true); }}
            className="flex items-center gap-2 rounded-xl border px-3 py-2 hover:border-teal-600 dark:bg-neutral-900"
          >
            <LazyTokenImage
              src={toToken?.icon}
              alt={toToken?.symbol}
            />
            <span className="font-semibold text-gray-700 dark:text-white">
              {toToken?.symbol}
            </span>
          </button>

              <Input
                value={toAmount}
                disabled
                className="w-32 text-right font-bold"
                placeholder="0.0"
              />
            </div> 
        </div>

        {error && (
          <p className="mb-2 text-sm text-red-500">{error}</p>
        )}

        <Button
          className="w-full"
          disabled={
            swapLoading ||
            quoteLoading ||
            !wallet.connected ||
            !fromAmount ||
            isSameToken ||
            insufficientBalance||
            !connection.rpcEndpoint.includes("mainnet")
          }
          onClick={handleSwap}
        >
          {swapLoading? "Swapping...": quoteLoading? "Fetching quote...": insufficientBalance? "Insufficient balance": !connection.rpcEndpoint.includes("mainnet")? "Swap available only for mainnet": isSameToken? "Select different tokens": "Swap"}
        </Button>
      </div>
    </div>
  );
}
