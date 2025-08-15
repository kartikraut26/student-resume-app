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
  You are a professional resume writer. Using the information below, create a compelling and ATS-friendly resume Summary, Career Objective, and Skill Highlights.
  Write the **Summary** and **Career Objective** in **first-person** using pronouns like "I", "my", and "me". 
  Do NOT use my name in these sections. 
  Do NOT refer to me as "the candidate" or "this person". 
  Write in a confident, professional, and concise tone.

  Details:
  Education: ${JSON.stringify(education)}
  Experience: ${JSON.stringify(experience)}
  Projects: ${JSON.stringify(projects)}
  Skills: ${skills}

  Instructions for writing:
  1. **Summary**: 3–4 sentences in first-person highlighting my background, technical expertise, and achievements. Mention tools, technologies, and accomplishments naturally without listing them mechanically.
  2. **Career Objective**: 1–2 concise sentences in first-person describing my career goals, passion for technology, and how I aim to contribute to an organization.
  3. **Skills**: Bullet-point list with each skill starting with a hyphen. Keep phrases complete (e.g., "Proficient in HTML, CSS, and JavaScript" rather than splitting across multiple bullets). Include both technical and soft skills.

  Format the output exactly like this:

  Summary:
  <summary here>

  Career Objective:
  <objective here>

  Skills:
  - <Skill 1>
  - <Skill 2>
  - <Skill 3>
  ...`;

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
