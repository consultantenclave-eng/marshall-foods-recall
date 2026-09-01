const express = require("express");

const app = express();

app.use(express.json());

// Render port
const PORT = process.env.PORT || 10000;

// Test route
app.get("/", (req, res) => {
  res.status(200).send("Recall.ai webhook server is running.");
});

// Recall.ai webhook - ROOT URL
app.post("/", (req, res) => {
  console.log("=================================");
  console.log("Recall.ai webhook received:");
  console.log(JSON.stringify(req.body, null, 2));
  console.log("=================================");

  res.status(200).json({
    success: true,
    received: true
  });
});

// Also keep /webhook working
app.post("/webhook", (req, res) => {
  console.log("=================================");
  console.log("Recall.ai webhook received at /webhook:");
  console.log(JSON.stringify(req.body, null, 2));
  console.log("=================================");

  res.status(200).json({
    success: true,
    received: true
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
