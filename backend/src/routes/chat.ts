// src/routes/chat.ts
import express from "express";
import multer from "multer";
import fs from "fs";
import { model } from "../utils/geminiClient";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/gemini", upload.single("file"), async (req, res) => {
  try {
    const userMessage = req.body.prompt || "No prompt provided";
    const language = req.body.language || "en";

    const prompt = `You are a professional Indian agricultural advisor.
Answer in a clear, practical, and supportive tone using local examples if helpful.
Language: ${language}
Question: ${userMessage}`;

    const parts: any[] = [{ text: prompt }];

    // If image attached
    if (req.file) {
      const imageData = fs.readFileSync(req.file.path);
      const imagePart = {
        inlineData: {
          data: imageData.toString("base64"),
          mimeType: req.file.mimetype,
        },
      };
      parts.push(imagePart);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
    }

    const result = await model.generateContent(parts);
    const responseText = result.response.text();

    res.json({ answer: responseText });
  } catch (err) {
    console.error("❌ Error generating response:", err);
    res.status(500).json({ error: "Error generating response" });
  }
});

export default router;