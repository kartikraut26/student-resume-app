import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "../pages/Resume.css";

const Resume = () => {
  const [userData, setUserData] = useState(null);
  const [generatedText, setGeneratedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const exportRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          setError("No user data found.");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGenerate = async () => {
    if (!userData) {
      setError("User data not loaded yet.");
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedText("");

    try {
      const response = await axios.post("http://localhost:8000/generate-resume-content", { userData });
      setGeneratedText(response.data.generatedText);
    } catch (err) {
      console.error("Error generating resume:", err);
      setError("Failed to generate content.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
  const element = document.getElementById("pdf-content");

  const opt = {
    margin: [0.4, 0.4, 0.4, 0.4], // top, left, bottom, right (in inches)
    filename: "SkillSync_Resume.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: document.body.scrollWidth,
      backgroundColor: "#ffffff"
    },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    pagebreak: {
      mode: ["avoid-all", "css", "legacy"]
    }
  };

  html2pdf().set(opt).from(element).save();
};


  const extractSection = (label, text) => {
    const regex = new RegExp(`${label}:([\\s\\S]*?)(\\n[A-Z][a-z]+:|$)`);
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  };

  const extractSkills = (label, text) => {
    const skillText = extractSection(label, text);
    return skillText
      .split(/\n|,/)
      .map(line => line.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);
  };

  return (
    <div className="resume-wrapper">
      <h2>AI Resume Builder</h2>

      <div className="button-group">
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate AI Suggestions"}
        </button>
        {generatedText && <button onClick={handleExportPDF}>Export as PDF</button>}
      </div>

      {error && <p className="error-message">{error}</p>}

      {generatedText && (
        <div className="resume-section">
          <h3>AI Suggestions</h3>
          <textarea readOnly value={generatedText}></textarea>
        </div>
      )}

      {generatedText && userData && (
        <div className="resume-preview" id="pdf-content">
          <div className="preview-box" ref={exportRef}>
            {/* Profile Image */}
            {userData.profileImage && (
              <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <img
                  src={userData.profileImage}
                  alt="Profile"
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #007ACC"
                  }}
                />
              </div>
            )}

            <h1 className="name">{userData.fullName || "Your Name"}</h1>
            <p className="contact">{userData.email || "you@example.com"} | {userData.phone || "Phone Number"}</p>
            <hr />

            <section>
              <h3>Career Objective</h3>
              <p>{extractSection("Objective", generatedText) || "AI Objective will appear here."}</p>
            </section>

            <section>
              <h3>Summary</h3>
              <p>{extractSection("Summary", generatedText) || "AI Summary will appear here."}</p>
            </section>

            <section>
              <h3>Skills</h3>
              <ul>
                {extractSkills("Skills", generatedText).map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3>Education</h3>
              <ul>
                {userData.education?.map((edu, index) => (
                  <li key={index}>
                    <strong>{edu.degree}</strong> at {edu.institution} ({edu.year})
                  </li>
                )) || <li>No education data found.</li>}
              </ul>
            </section>

            <section>
              <h3>Projects</h3>
              <ul>
                {userData.projects?.map((proj, index) => (
                  <li key={index}>
                    <strong>{proj.title}</strong>: {proj.description}
                  </li>
                )) || <li>No projects found.</li>}
              </ul>
            </section>

            <section>
              <h3>Experience</h3>
              <ul>
                {userData.experience?.map((exp, index) => (
                  <li key={index}>
                    <strong>{exp.role}</strong> at {exp.company} ({exp.duration})
                  </li>
                )) || <li>No experience listed.</li>}
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resume;
