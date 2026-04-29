import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 8787;

app.use(express.json());

app.post("/api/mentor", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res
        .status(500)
        .json({ error: "OPENAI_API_KEY is missing on server." });
    }

    const { profile, expenses, goals, question } = req.body || {};

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are PocketMentor. Answer the question first. Be direct, practical, and slightly strict. If user shows stress/confusion/frustration, respond with empathy first then guidance. Do not repeat user input unnecessarily. Include exactly: 1 clear action, 1 mistake to avoid, 1 wealth-building habit. Educational only: no guaranteed returns and no individual stock certainty.",
        },
        {
          role: "user",
          content: `User profile: ${JSON.stringify(profile)}\nExpenses: ${JSON.stringify(expenses)}\nGoals: ${JSON.stringify(goals)}\nQuestion: ${question || "What should I do with my money this week?"}\nFirst answer the user question directly in one sentence. Then provide: 1) diagnosis of real issue, 2) concrete 7-day action plan, 3) one rich person habit, 4) one student survival move, 5) one Australia money lesson when relevant. Do not repeat numbers unnecessarily. If investing asked: Step 1 emergency fund, Step 2 high-interest savings account, Step 3 learn ETFs, Step 4 start tiny only with money not needed soon.`,
        },
      ],
    });

    res.json({ advice: response.output_text || "No advice generated." });
  } catch (error) {
    res
      .status(500)
      .json({ error: error?.message || "Failed to generate mentor advice." });
  }
});

app.listen(port, () => {
  console.log(`Money Mentor API running on http://localhost:${port}`);
});
