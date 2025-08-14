const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { CohereClient } = require("cohere-ai");

dotenv.config();

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

const COHERE_API_KEY = process.env.COHERE_API_KEY;

if (!COHERE_API_KEY) {
  console.error("❌ Missing COHERE_API_KEY in .env file");
  process.exit(1);
}

// ✅ Create Cohere client (v6+)
const cohere = new CohereClient({
  token: COHERE_API_KEY,
});

// ✅ POST endpoint for resume AI generation
app.post("/generate-resume-content", async (req, res) => {
  const { userData } = req.body;

  if (!userData) {
    return res.status(400).json({ error: "Missing userData in request body" });
  }

  const { fullName, email, phone, education, experience, projects, skills } = userData;

  const prompt = `
Generate a professional resume summary, career objective, and skill highlights for a candidate with the following information:

Name: ${fullName}
Email: ${email}
Phone: ${phone}

Education: ${JSON.stringify(education)}
Experience: ${JSON.stringify(experience)}
Projects: ${JSON.stringify(projects)}
Skills: ${skills}

Provide the output in this format:

Summary:
<summary here>

Career Objective:
<objective here>

Skills:
<skill list here>
`;

  try {
    const response = await cohere.generate({
      model: "command-r-plus",
      prompt: prompt,
      max_tokens: 300,
      temperature: 0.7,
    });

    const generatedText = response.generations[0].text;
    res.status(200).json({ generatedText });
  } catch (error) {
    console.error("AI generation error:", error);
    res.status(500).json({ error: "AI generation failed." });
  }
});

// ✅ Server start
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
