const axios = require("axios");

exports.generateAIResume = async (req, res) => {
  try {
    const { name, education, skills } = req.body;

    const response = await axios.post(
      `${process.env.PYTHON_API_URL}/generate`,
      { name, education, skills }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Error generating resume" });
  }
};

