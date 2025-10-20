// server.js
const express = require("express");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

// Sample buy token route
app.post("/api/buy", async (req, res) => {
  const { amount, tokenSymbol } = req.body;

  try {
    // Replace with the actual exchange or Pump Fun API logic to buy the token
    const response = await axios.post("https://your-exchange-api/buy", {
      amount,
      tokenSymbol
    });

    res.status(200).json({
      message: `Successfully bought ${amount} ${tokenSymbol}`,
      data: response.data
    });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong while buying the token." });
  }
});

// Sample sell token route
app.post("/api/sell", async (req, res) => {
  const { amount, tokenSymbol } = req.body;

  try {
    // Replace with the actual exchange or Pump Fun API logic to sell the token
    const response = await axios.post("https://your-exchange-api/sell", {
      amount,
      tokenSymbol
    });

    res.status(200).json({
      message: `Successfully sold ${amount} ${tokenSymbol}`,
      data: response.data
    });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong while selling the token." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
