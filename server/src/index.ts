import express, { Request, Response } from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 8787;

app.use(cors());
app.use(express.json());

const JUP_API_QUOTE = 'https://api.jup.ag/swap/v1/quote';
const JUP_API_SWAP = 'https://api.jup.ag/swap/v1/swap';
const JUP_TOKEN_API = "https://api.jup.ag/tokens/v2/tag?query=verified"
const X_API_KEY = process.env.JUPITER_API_KEY || "";

app.get("/jupiter/tokens", async (req: Request, res: Response) => {
  try {
    if (!X_API_KEY) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const response = await fetch(JUP_TOKEN_API, {
      method: "GET",
      headers: { "x-api-key": X_API_KEY },
    });

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Jupiter token list failed" });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Token list proxy error:", err);
    res.status(500).json({ error: "Proxy error" });
  }
});

/* ---------------- QUOTE ---------------- */
app.get("/jupiter/quote", async (req: Request, res: Response) => {
  try {
    if (!X_API_KEY) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const params = new URLSearchParams(req.query as any);

    const response = await fetch(
      `${JUP_API_QUOTE}?${params.toString()}`,
      {
        method: "GET",
        headers: { 
          "x-api-key": X_API_KEY,
          "Content-Type": "application/json" 
        },
      }
    );

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Jupiter quote failed" });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Quote proxy error:", err);
    res.status(500).json({ error: "Proxy error" });
  }
});

/* ---------------- SWAP ---------------- */
app.post("/jupiter/swap", async (req: Request, res: Response) => {
  try {
    if (!X_API_KEY) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const { quoteResponse, userPublicKey } = req.body;

    // validate payload
    if (!quoteResponse || !userPublicKey) {
      return res.status(400).json({
        error: "Invalid swap payload",
      });
    }

    const response = await fetch(
      JUP_API_SWAP,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": X_API_KEY
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          dynamicSlippage: false,
          prioritizationFeeLamports: {
              priorityLevelWithMaxLamports: {
                maxLamports: 1000000,
                priorityLevel: "veryHigh"
              }
            }}
        ),
      }
    );

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Jupiter swap failed" });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Swap proxy error:", err);
    res.status(500).json({ error: "Proxy error" });
  }
});

/* ---------------- HEALTH ---------------- */
app.get("/health", (_, res) => {
  res.send("OK");
});

app.listen(PORT, () => {
  console.log(`✅ Jupiter proxy running on http://localhost:${PORT}`);
});
