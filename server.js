const express = require("express");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 10000;

const RECALL_API_KEY = process.env.RECALL_API_KEY;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

const RECALL_API_URL = "https://us-west-2.recall.ai/api/v1/bot/";

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

// Create Recall Bot page
app.get("/create-bot", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Marshall Foods - Create Graham Bot</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
          }

          input {
            width: 100%;
            padding: 12px;
            margin: 8px 0 16px;
            box-sizing: border-box;
          }

          button {
            padding: 12px 20px;
            cursor: pointer;
          }
        </style>
      </head>

      <body>
        <h2>Create Graham Interview Bot</h2>

        <form method="POST" action="/create-bot">

          <label>Google Meet URL</label>
          <input
            type="text"
            name="meeting_url"
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            required
          >

          <label>Admin Token</label>
          <input
            type="password"
            name="admin_token"
            required
          >

          <button type="submit">
            Create Graham Bot
          </button>

        </form>
      </body>
    </html>
  `);
});

// Create Recall Bot
app.post("/create-bot", async (req, res) => {
  try {
    const { meeting_url, admin_token } = req.body;

    if (!ADMIN_TOKEN || admin_token !== ADMIN_TOKEN) {
      return res.status(401).send("Unauthorized.");
    }

    if (!RECALL_API_KEY) {
      return res.status(500).send("RECALL_API_KEY is not configured.");
    }

    if (!meeting_url || !meeting_url.includes("meet.google.com")) {
      return res.status(400).send("Please enter a valid Google Meet URL.");
    }

    const response = await fetch(RECALL_API_URL, {
      method: "POST",
      headers: {
        "Authorization": RECALL_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        meeting_url: meeting_url,
        bot_name: "Graham - Marshall Foods",

        output_media: {
          camera: {
            kind: "webpage",
            config: {
              url: "https://marshall-foods-recall.onrender.com/graham"
            }
          }
        },

        recording_config: {
          include_bot_in_recording: {
            audio: true
          }
        },

        variant: {
          google_meet: "web_4_core"
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Recall API error:", data);

      return res.status(response.status).send(`
        <h2>Recall Bot Creation Failed</h2>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      `);
    }

    console.log("Recall Bot Created:");
    console.log(JSON.stringify(data, null, 2));

    res.send(`
      <h2>Graham Bot Created Successfully ✅</h2>

      <p>Recall has received the request.</p>

      <pre>${JSON.stringify(data, null, 2)}</pre>

      <p>
        Now return to your Google Meet and wait for Graham to request entry.
      </p>
    `);

  } catch (error) {
    console.error("Create bot error:", error);

    res.status(500).send(`
      <h2>Server Error</h2>
      <pre>${error.message}</pre>
    `);
  }
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
