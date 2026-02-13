Solana Jupiter Swap (Client + Server)

A simple Solana token swap application built with Jupiter v6, consisting of a React (Vite) client and a Node.js (Express) proxy server.

The backend proxy is used to securely interact with Jupiter APIs and to enforce mainnet-only swaps.

Features

Swap SPL tokens using Jupiter Aggregator

Real-time price quotes

Token balance checks

Prevents swaps with insufficient balance

Mainnet-only swap protection

No API keys exposed in the frontend

Clean separation of client and server

Architecture
Client (Vite + React)
        |
        |  /jupiter/*
        |
Proxy Server (Express)
        |
        |  Jupiter v6 APIs
        |
Jupiter Aggregator (Mainnet)

Network Support
Feature	Devnet	Mainnet
Token list	✅	✅
Quote	✅	✅
Swap	❌	✅

⚠️ Jupiter swaps only work on mainnet.
This is enforced on the server.

Project Structure
.
├── client/        # React (Vite) frontend
├── server/        # Express proxy server
└── README.md

Setup & Run
1. Start the Server
cd server
npm install
npm run dev


Health check:

curl http://localhost:8787/health

2. Start the Client
cd client
npm install
npm run dev

Vite Proxy Configuration

The client uses a Vite proxy to forward requests to the backend.

client/vite.config.ts:

server: {
  proxy: {
    "/jupiter": {
      target: "http://localhost:8787",
      changeOrigin: true
    }
  }
}

API Endpoints (Server)
Get Tokens
GET /jupiter/tokens

Get Quote
GET /jupiter/quote

Swap (Mainnet Only)
POST /jupiter/swap


Request body:

{
  "quoteResponse": { "exact quote from /quote" },
  "userPublicKey": "BASE58_PUBLIC_KEY"
}


