const express = require("express");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 10000;

// Graham LiveAvatar webpage
app.get("/graham", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Graham - Marshall Foods</title>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background: #000;
            overflow: hidden;
          }

          iframe {
            width: 100%;
            height: 100%;
            border: 0;
          }
        </style>
      </head>
      <body>
        <iframe
          src="https://embed.liveavatar.com/v1/36cc138c-b1e7-40de-bbe3-162174802e50?orientation=horizontal"
          allow="microphone"
          title="Graham - Marshall Foods">
        </iframe>
      </body>
    </html>
  `);
});

// Health check
app.get("/", (req, res) => {
  res.status(200).send("Marshall Foods Recall server is running.");
});

// Recall.ai webhook
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
