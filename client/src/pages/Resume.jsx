import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";
import { auth, db } from "../services/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "../pages/Resume.css";
import { FaArrowUp } from 'react-icons/fa';

const Resume = () => {
  const [userData, setUserData] = useState(null);
  const [generatedText, setGeneratedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentSuggestions, setRecentSuggestions] = useState([]);
  const exportRef = useRef(null);
  const recentRef = useRef(null); // scroll to recent suggestions
  const [showScroll, setShowScroll] = useState(false); // show/hide scroll to top button

  // Load user data from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setRecentSuggestions(data.suggestions || []);
        } else {
          setError("No user data found.");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Show "Go to Top" button after scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScroll(true);
      } else {
        setShowScroll(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Generate AI Resume Content
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

  // Save AI Suggestion to Firestore
  const handleSaveSuggestion = async () => {
    if (!generatedText || !auth.currentUser) return;

    try {
      const docRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(docRef, {
        suggestions: arrayUnion({
          text: generatedText,
          timestamp: new Date().toISOString(),
        }),
      });

      const newSuggestion = {
        text: generatedText,
        timestamp: new Date().toISOString(),
      };

      setRecentSuggestions((prev) => [newSuggestion, ...prev]);

      // Scroll to recent suggestions
      setTimeout(() => {
        recentRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (err) {
      console.error("Error saving suggestion:", err);
      setError("Failed to save suggestion.");
    }
  };

  // ✅ Remove all suggestions
  const handleRemoveAllSuggestions = async () => {
    if (!auth.currentUser) return;
    try {
      const docRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(docRef, { suggestions: [] });
      setRecentSuggestions([]);
    } catch (err) {
      console.error("Error removing all suggestions:", err);
      setError("Failed to remove suggestions.");
    }
  };

  // Export PDF
  const handleExportPDF = () => {
    const element = document.getElementById("pdf-content");

    const opt = {
      margin: [0.4, 0.4, 0.4, 0.4],
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
      pagebreak: { mode: ["avoid-all", "css", "legacy"] }
    };

    html2pdf().set(opt).from(element).save();
  };

  // Extract a text section from AI output
  const extractSection = (label, text) => {
    const regex = new RegExp(`${label}:([\\s\\S]*?)(\\n[A-Z][a-z]+:|$)`);
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  };

  const extractSkills = (label, text) => {
    const skillText = extractSection(label, text);
    return skillText
      .split(/\r?\n/)
      .map(line => {
        const parts = line.split("**");
        return parts.map((part, i) =>
          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        );
      })
      .filter(line => line.length > 0);
  };

  return (
    <div className="resume-wrapper">
      <div className="resume-card">
        <h2>AI Resume Builder</h2>
        <p className="info-text">
          Welcome to the AI Resume Builder! 🎓✨ <br />
          Generate professional career objectives, summaries, and skill
          suggestions tailored to your profile. You can edit, export as PDF, or
          save suggestions for later use.
        </p>

        <div className="button-group">
          <button onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <div className="spinner-with-text">
                <div className="spinner"></div> Generating...
              </div>
            ) : (
              "Generate AI Suggestions"
            )}
          </button>
          {generatedText && (
            <>
              <button onClick={handleExportPDF}>Export as PDF</button>
              <button onClick={handleSaveSuggestion}>Save Suggestion</button>
            </>
          )}
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
              <p className="contact">
                {userData.email || "you@example.com"} | {userData.phone || "Phone Number"}
              </p>
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

              <section>
                <h3>Certifications</h3>
                <ul>
                  {userData.certifications?.length > 0 ? (
                    userData.certifications.map((cert, index) => (
                      <li key={index}>{cert}</li>
                    ))
                  ) : (
                    <li>No certifications listed.</li>
                  )}
                </ul>
              </section>
            </div>
          </div>
        )}

        {/* ✅ Remove All Suggestions Button */}
        {recentSuggestions.length > 0 && (
          <div style={{ textAlign: "center", margin: "1.5rem 0" }}>
            <button 
              onClick={handleRemoveAllSuggestions} 
              style={{
                padding: "10px 18px",
                border: "none",
                borderRadius: "20px",
                background: "#e74c3c",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Remove All Suggestions
            </button>
          </div>
        )}

        {/* Recent Suggestions */}
        {recentSuggestions.length > 0 && (
          <div className="recent-suggestions" ref={recentRef}>
            <h3>Recent Suggestions</h3>
            <ul>
              {recentSuggestions.map((sug, index) => (
                <li key={index}>
                  <pre>{sug.text}</pre>
                  <small>{new Date(sug.timestamp).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Scroll to Top button */}
      {showScroll && (
        <button 
          className="go-up-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <FaArrowUp />
        </button>
      )}
    </div>
  );
};

export default Resume;
