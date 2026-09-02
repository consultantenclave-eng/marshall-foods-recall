const express = require("express");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 10000;

const RECALL_API_KEY = process.env.RECALL_API_KEY;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const LIVEAVATAR_API_KEY = process.env.LIVEAVATAR_API_KEY;

const RECALL_API_URL = "https://us-west-2.recall.ai/api/v1/bot/";
const LIVEAVATAR_API_URL = "https://api.liveavatar.com";

const GRAHAM_AVATAR_ID = "e9844e6d-847e-4964-a92b-7ecd066f69df";
const GRAHAM_CONTEXT_ID = "1643038e-5417-4d28-bcb6-59b2fecef03d";

// ======================================================
// LIVEAVATAR SESSION TOKEN
// ======================================================

app.post("/liveavatar-token", async (req, res) => {
  try {
    if (!LIVEAVATAR_API_KEY) {
      return res.status(500).json({
        error: "LIVEAVATAR_API_KEY is not configured."
      });
    }

    const response = await fetch(
      `${LIVEAVATAR_API_URL}/v1/sessions/token`,
      {
        method: "POST",
        headers: {
          "X-API-KEY": LIVEAVATAR_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "FULL",
          avatar_id: GRAHAM_AVATAR_ID,
          avatar_persona: {
            context_id: GRAHAM_CONTEXT_ID,
            language: "en"
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "LiveAvatar token error:",
        JSON.stringify(data, null, 2)
      );

      return res.status(response.status).json({
        error: "Failed to create LiveAvatar session.",
        details: data
      });
    }

    const sessionToken = data?.data?.session_token;
    const sessionId = data?.data?.session_id;

    if (!sessionToken) {
      return res.status(500).json({
        error: "LiveAvatar did not return a session token."
      });
    }

    res.status(200).json({
      session_token: sessionToken,
      session_id: sessionId
    });

  } catch (error) {
    console.error("LiveAvatar token route error:", error);

    res.status(500).json({
      error: error.message
    });
  }
});


// ======================================================
// GRAHAM LIVEAVATAR WEBPAGE
// ======================================================

app.get("/graham", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Graham - Marshall Foods</title>

  <style>

    html,
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #000;
      overflow: hidden;
    }

    body {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #avatar {
      width: 100%;
      height: 100%;
      object-fit: cover;
      background: #000;
      display: block;
    }

    #status {
      position: fixed;
      top: 15px;
      left: 15px;
      z-index: 10;

      padding: 8px 12px;

      background: rgba(0, 0, 0, 0.65);
      color: white;

      border-radius: 6px;

      font-family: Arial, sans-serif;
      font-size: 13px;
    }

    #error {
      display: none;

      position: fixed;
      left: 20px;
      right: 20px;
      bottom: 20px;

      z-index: 20;

      padding: 12px;

      background: rgba(160, 0, 0, 0.9);
      color: white;

      border-radius: 8px;

      font-family: Arial, sans-serif;
      font-size: 13px;
    }

  </style>

</head>

<body>

  <div id="status">
    Starting Graham...
  </div>

  <video
    id="avatar"
    autoplay
    playsinline
  ></video>

  <div id="error"></div>


  <script type="module">

    import {
      LiveAvatarSession
    } from "https://esm.sh/@heygen/liveavatar-web-sdk@0.0.18";


    const video = document.getElementById("avatar");
    const status = document.getElementById("status");
    const errorBox = document.getElementById("error");


    let session = null;


    function setStatus(message) {
      status.textContent = message;
      console.log(message);
    }


    function showError(message) {

      console.error(message);

      errorBox.textContent = message;
      errorBox.style.display = "block";

      setStatus("Graham connection error");

    }


    async function startGraham() {

      try {

        setStatus("Connecting to Graham...");


        // Get a short-lived LiveAvatar session token
        // from our backend.
        const tokenResponse = await fetch(
          "/liveavatar-token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            }
          }
        );


        const tokenData = await tokenResponse.json();


        if (!tokenResponse.ok) {

          throw new Error(
            tokenData.error ||
            "Could not create LiveAvatar session."
          );

        }


        if (!tokenData.session_token) {

          throw new Error(
            "No LiveAvatar session token received."
          );

        }


        setStatus("Starting Graham...");


        session = new LiveAvatarSession(
          tokenData.session_token,
          {
            voiceChat: true
          }
        );


        // Start LiveAvatar session.
        await session.start();


        // Attach Graham's audio + video stream.
        session.attach(video);


        // Make sure browser plays the media.
        try {
          await video.play();
        } catch (playError) {
          console.warn(
            "Video autoplay warning:",
            playError
          );
        }


        setStatus("Graham is ready");


        console.log(
          "Graham LiveAvatar session started:",
          tokenData.session_id
        );


        // Keep the LiveAvatar session alive.
        setInterval(
          async () => {

            try {

              await session.keepAlive();

              console.log(
                "Graham session keep-alive sent."
              );

            } catch (error) {

              console.warn(
                "Keep-alive failed:",
                error
              );

            }

          },
          150000
        );


      } catch (error) {

        showError(
          "Graham could not start: " +
          error.message
        );

      }

    }


    // Start automatically.
    startGraham();


    // Stop the LiveAvatar session when the page closes.
    window.addEventListener(
      "beforeunload",
      () => {

        if (session) {

          session.stop().catch(
            () => {}
          );

        }

      }
    );

  </script>

</body>

</html>
  `);
});


// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/", (req, res) => {

  res.status(200).send(
    "Marshall Foods Recall server is running."
  );

});


// ======================================================
// CREATE RECALL BOT PAGE
// ======================================================

app.get("/create-bot", (req, res) => {

  res.send(`
<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8">

  <title>
    Marshall Foods - Create Graham Bot
  </title>

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

  <h2>
    Create Graham Interview Bot
  </h2>

  <form
    method="POST"
    action="/create-bot"
  >

    <label>
      Google Meet URL
    </label>

    <input
      type="text"
      name="meeting_url"
      placeholder="https://meet.google.com/xxx-xxxx-xxx"
      required
    >


    <label>
      Admin Token
    </label>

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


// ======================================================
// CREATE RECALL BOT
// ======================================================

app.post("/create-bot", async (req, res) => {

  try {

    const {
      meeting_url,
      admin_token
    } = req.body;


    if (
      !ADMIN_TOKEN ||
      admin_token !== ADMIN_TOKEN
    ) {

      return res
        .status(401)
        .send("Unauthorized.");

    }


    if (!RECALL_API_KEY) {

      return res
        .status(500)
        .send(
          "RECALL_API_KEY is not configured."
        );

    }


    if (
      !meeting_url ||
      !meeting_url.includes(
        "meet.google.com"
      )
    ) {

      return res
        .status(400)
        .send(
          "Please enter a valid Google Meet URL."
        );

    }


    const response = await fetch(
      RECALL_API_URL,
      {
        method: "POST",

        headers: {
          "Authorization": RECALL_API_KEY,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          meeting_url: meeting_url,

          bot_name:
            "Graham - Marshall Foods",


          output_media: {

            camera: {

              kind: "webpage",

              config: {

                url:
                  "https://marshall-foods-recall.onrender.com/graham"

              }

            }

          },


          recording_config: {

            include_bot_in_recording: {

              audio: true

            }

          },


          variant: {

            google_meet:
              "web_4_core"

          }

        })

      }
    );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(
        "Recall API error:",
        data
      );


      return res
        .status(response.status)
        .send(`
          <h2>
            Recall Bot Creation Failed
          </h2>

          <pre>
${JSON.stringify(data, null, 2)}
          </pre>
        `);

    }


    console.log(
      "Recall Bot Created:"
    );

    console.log(
      JSON.stringify(
        data,
        null,
        2
      )
    );


    res.send(`

      <h2>
        Graham Bot Created Successfully ✅
      </h2>

      <p>
        Recall has received the request.
      </p>

      <pre>
${JSON.stringify(data, null, 2)}
      </pre>

      <p>
        Now return to your Google Meet
        and wait for Graham to request entry.
      </p>

    `);


  } catch (error) {

    console.error(
      "Create bot error:",
      error
    );


    res
      .status(500)
      .send(`

        <h2>
          Server Error
        </h2>

        <pre>
${error.message}
        </pre>

      `);

  }

});


// ======================================================
// RECALL.AI WEBHOOK
// ======================================================

app.post("/", (req, res) => {

  console.log(
    "================================="
  );

  console.log(
    "Recall.ai webhook received:"
  );

  console.log(
    JSON.stringify(
      req.body,
      null,
      2
    )
  );

  console.log(
    "================================="
  );


  res.status(200).json({

    success: true,

    received: true

  });

});


// ======================================================
// ALSO KEEP /WEBHOOK WORKING
// ======================================================

app.post("/webhook", (req, res) => {

  console.log(
    "================================="
  );

  console.log(
    "Recall.ai webhook received at /webhook:"
  );

  console.log(
    JSON.stringify(
      req.body,
      null,
      2
    )
  );

  console.log(
    "================================="
  );


  res.status(200).json({

    success: true,

    received: true

  });

});


// ======================================================
// START SERVER
// ======================================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "Server running on port " + PORT
    );

  }
);
