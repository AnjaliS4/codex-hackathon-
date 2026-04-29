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
            "You are Money Mentor, a supportive and practical financial education assistant for international students in Australia. Provide educational guidance only, no guaranteed returns, no promises, no specific stock picks as certainty.",
        },
        {
          role: "user",
          content: `User profile: ${JSON.stringify(profile)}\nExpenses: ${JSON.stringify(expenses)}\nGoals: ${JSON.stringify(goals)}\nQuestion: ${question || "What should I do with my money this week?"}\nGive concise sections: Reality check, Bills first, Emergency fund, Goal plan, Spending allowance, Investing learning, This week action.`,
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
