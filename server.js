const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Test route
app.get("/", (req, res) => {
  res.status(200).send("Recall.ai webhook server is running.");
});

// Recall.ai webhook
app.post("/webhook", (req, res) => {
  console.log("Recall.ai webhook received:");
  console.log(JSON.stringify(req.body, null, 2));

  // Recall.ai ko successful response
  res.status(200).json({
    success: true,
    received: true
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
