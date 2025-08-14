const express = require("express");
const router = express.Router();
const { generateAIResume } = require("../controllers/resumeController");

router.post("/generate", generateAIResume);

module.exports = router;