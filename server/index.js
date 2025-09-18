import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { CohereClient } from "cohere-ai";

dotenv.config();

const app = express();
const PORT = 8000;

app.use(cors());
app.use(bodyParser.json());

// ✅ Ensure API key exists
if (!process.env.COHERE_API_KEY) {
  console.error("❌ Missing COHERE_API_KEY in .env file");
  process.exit(1);
}

// ✅ Cohere client
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

// ✅ Endpoint
app.post("/generate-resume-content", async (req, res) => {
  const { userData } = req.body;

  if (!userData) {
    return res.status(400).json({ error: "Missing userData in request body" });
  }

  // 📝 Improved prompt (one-line version to avoid formatting issues in JS string)
  const prompt = `You are a professional resume writer with expertise in creating ATS-optimized resumes; using the details provided below, generate a strong and compelling Resume Summary, Career Objective, and Skills Section written in first person (using "I", "my", "me"), with the Summary highlighting achievements, the Career Objective being forward-looking, and Skills rewritten into improved, professional, and ATS-friendly bullet points (e.g., instead of "HTML", use "Proficient in HTML5 for building responsive layouts"); do not include my name or refer to me in third person, and output must follow exactly this format:

Summary:
<summary here>

Career Objective:
<objective here>

Skills:
- <Improved Skill 1>
- <Improved Skill 2>
- <Improved Skill 3>
...

Details:
${JSON.stringify(userData, null, 2)}`;

  try {
    const response = await cohere.chat({
      model: "command-a-03-2025", // ✅ Latest supported model
      messages: [{ role: "user", content: prompt }],
    });

    // Cohere's chat API returns content inside response.message.content
    const generatedText =
      response.message?.content?.map((c) => c.text).join("\n") || "";

    res.status(200).json({ generatedText });
  } catch (error) {
    console.error("AI generation error:", error);
    res.status(500).json({ error: "AI generation failed." });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
