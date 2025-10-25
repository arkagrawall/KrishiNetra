// backend/server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Gemini SDK import
const { model } = require("./utils/geminiClient"); // your Gemini client helper

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => res.send("Backend running!"));

// Gemini route
app.post("/api/gemini", upload.single("file"), async (req, res) => {
  try {
    const prompt = req.body.prompt || "No prompt provided";
    const language = req.body.language || "en";

    const contents = [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ];

    // If image attached
    if (req.file) {
      const imagePart = {
        inlineData: {
          data: req.file.buffer.toString("base64"),
          mimeType: req.file.mimetype,
        },
      };
      contents.push({ role: "user", parts: [imagePart] });
    }

    // Generate answer using Gemini
    const result = await model.generateContent({ contents });
    const responseText = result.response.text();

    res.json({ answer: responseText });
  } catch (err) {
    console.error("❌ Gemini error:", err);
    res.status(500).json({ error: "Error generating response via Gemini" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
