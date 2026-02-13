import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { VersionedTransaction, Connection, PublicKey } from '@solana/web3.js'
import axios from 'axios'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function ellipsify(str = '', len = 4, delimiter = '..') {
  const strLen = str.length
  const limit = len * 2 + delimiter.length

  return strLen >= limit ? str.substring(0, len) + delimiter + str.substring(strLen - len, strLen) : str
}

export type TokenInfo = {
  id: string;
  symbol: string;
  chainId?: number;
  decimals: number;
  icon?: string;
  name?: string;
  tags?: string[];
  extensions?: {
    coingeckoId?: string;
    [key: string]: any;
  };
};

export type JupiterQuote = {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: "ExactIn" | "ExactOut";
  slippageBps: number;
  priceImpactPct: string;
  routePlan: any[];
  contextSlot: number;
  timeTaken: number;
};


const JUP_API_QUOTE = 'http://localhost:8787/jupiter/quote';
const JUP_API_SWAP = 'http://localhost:8787/jupiter/swap';
const JUP_LEND_API = "http://localhost:8787/jupiter/tokens"

export async function fetchEarnTokens(): Promise<TokenInfo[]> {
  try {
    const { data } = await axios.get<TokenInfo[]>(JUP_LEND_API);
    console.log("Earn tokens fetched:", data);
    return data;
  } catch (error) {
    console.error("Failed to fetch earn tokens:", error);
    throw new Error("Failed to fetch earn token list");
  }
}

export async function getQuote(fromToken: TokenInfo, toToken: TokenInfo, amount: number, slippage: number): Promise<JupiterQuote> {
    const MIN_AMOUNT = 0.01; // Example minimum amount for swap
    if( amount < MIN_AMOUNT) {
      throw new Error(`Amount must be greater than ${MIN_AMOUNT} ${fromToken.symbol}`);
    }
    const inputAmount = Math.floor(amount * Math.pow(10, fromToken.decimals));
    const {data: quoteData} = await axios.get<JupiterQuote>(JUP_API_QUOTE, {
      params: {
        inputMint: fromToken.id,
        outputMint: toToken.id,
        amount: inputAmount,
        slippageBps: slippage * 100,
        onlyDirectRoutes: false,
        asLegacyTransaction: false
      }
    });

    if (!quoteData || !quoteData.outAmount) {
      console.error("Invalid quote:", quoteData);
      throw new Error('No valid quote data found');
    }
    return quoteData;
}


export async function executeSwap(quoteResponse: JupiterQuote, connection: Connection, wallet: any): Promise<string> {

    const publicKey = wallet.publicKey;
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }


    const {data: swapResponse} = await axios.post<{ swapTransaction: string }>(JUP_API_SWAP, 
      {
      quoteResponse,
      userPublicKey: publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      dynamicSlippage: false,
      prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: 1000000,
            priorityLevel: "veryHigh"
          }
        }
    }
    );

    if (!swapResponse || typeof swapResponse.swapTransaction !== "string") {
      console.error("Invalid Jupiter swap response:", swapResponse);
      throw new Error("Jupiter did not return a swapTransaction");
    }

    try{
    // deserialize the transaction
    const transaction = VersionedTransaction.deserialize(Buffer.from(swapResponse.swapTransaction, 'base64'));

    // sign the transaction
    
      const signedTransaction = await wallet.signTransaction(transaction);
      
    // get the latest block hash
    const latestBlockHash = await connection.getLatestBlockhash();

    // Execute the transaction
    const rawTransaction = signedTransaction.serialize()
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2
    });

    // confirm the transaction
    await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: txid
    });
    console.log(`https://solscan.io/tx/${txid}`);

    return txid;
    } catch (error) {
      console.error("Swap execution failed:", error);
      throw new Error("Failed to execute swap transaction");
    }
}

const SOL_MINT = "So11111111111111111111111111111111111111112";

export async function getTokenBalance(
  connection: Connection,
  owner: PublicKey,
  token: {
    id: string;
    decimals: number;
  }
): Promise<number> {

  // ✅ 1. SOL balance (native)
  if (token.id === SOL_MINT) {
    const lamports = await connection.getBalance(owner);
    return lamports / 1e9;
  }

  // ✅ 2. SPL token balance
  let mint: PublicKey;
  try {
    mint = new PublicKey(token.id);
  } catch {
    console.error("Invalid token mint:", token.id);
    return 0;
  }

  const accounts = await connection.getParsedTokenAccountsByOwner(
    owner,
    { mint }
  );

  if (accounts.value.length === 0) {
    return 0;
  }

  const uiAmount =
    accounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;

  return uiAmount ?? 0;
}