import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const API_KEY = process.env.COVALENT_API_KEY;
const CHAIN = "eth-mainnet";

// Whale wallet addresses to monitor
const WHALE_WALLETS = [
  { address: "0x28C6c06298d514Db089934071355E5743bf21d60", name: "Binance Hot Wallet" },
  { address: "0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549", name: "Binance Cold Wallet" },
  { address: "0xDFd5293D8e347dFe59E90eFd55b2956a1343963d", name: "Kraken" },
  { address: "0x267be1C1D684F78cb4F6a176C4911b741E4Ffdc0", name: "Kraken 4" },
];

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Whale API Server is running" });
});

// Get all whale wallets
app.get("/api/whales", (req, res) => {
  res.json(WHALE_WALLETS);
});

// Get whale wallet balances
app.get("/api/balances/:address", async (req, res) => {
  const { address } = req.params;
  const url = `https://api.covalenthq.com/v1/${CHAIN}/address/${address}/balances_v2/`;

  try {
    const { data } = await axios.get(url, {
      auth: { username: API_KEY, password: "" },
    });
    res.json(data.data);
  } catch (error) {
    console.error("Error fetching balances:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch balances" });
  }
});

// Get recent transactions for whale wallet
app.get("/api/transactions/:address", async (req, res) => {
  const { address } = req.params;
  const url = `https://api.covalenthq.com/v1/${CHAIN}/address/${address}/transactions_v3/`;

  try {
    const { data } = await axios.get(url, {
      auth: { username: API_KEY, password: "" },
    });
    res.json(data.data);
  } catch (error) {
    console.error("Error fetching transactions:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Get token transfers for analysis
app.get("/api/transfers/:address", async (req, res) => {
  const { address } = req.params;
  const url = `https://api.covalenthq.com/v1/${CHAIN}/address/${address}/transfers_v2/`;

  try {
    const { data } = await axios.get(url, {
      auth: { username: API_KEY, password: "" },
    });
    res.json(data.data);
  } catch (error) {
    console.error("Error fetching transfers:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch transfers" });
  }
});

// Analyze whale activity
app.get("/api/analyze/:address", async (req, res) => {
  const { address } = req.params;
  const url = `https://api.covalenthq.com/v1/${CHAIN}/address/${address}/transactions_v3/`;

  try {
    const { data } = await axios.get(url, {
      auth: { username: API_KEY, password: "" },
    });

    const transactions = data.data;
    if (!transactions?.items) {
      return res.json({ error: "No transactions found" });
    }

    const recentTxs = transactions.items.slice(0, 10);
    let depositCount = 0;
    let withdrawCount = 0;
    let totalValue = 0;

    recentTxs.forEach((tx) => {
      if (tx.value) {
        totalValue += parseFloat(tx.value) / 1e18;
      }
      if (tx.from_address?.toLowerCase() === address.toLowerCase()) {
        depositCount++;
      } else {
        withdrawCount++;
      }
    });

    let signal = "neutral";
    let message = "Neutral activity pattern";
    if (depositCount > withdrawCount) {
      signal = "bearish";
      message = "More outgoing than incoming → Potential distribution/selling";
    } else if (withdrawCount > depositCount) {
      signal = "bullish";
      message = "More incoming than outgoing → Accumulation pattern";
    }

    res.json({
      depositCount,
      withdrawCount,
      totalValue,
      txCount: recentTxs.length,
      signal,
      message,
    });
  } catch (error) {
    console.error("Error analyzing:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to analyze whale activity" });
  }
});

app.listen(PORT, () => {
  console.log(`🐋 Whale API Server running on http://localhost:${PORT}`);
});

