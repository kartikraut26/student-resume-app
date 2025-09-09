import React, { useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import './Profile.css';
import axios from 'axios';
import { FaPen, FaArrowUp } from 'react-icons/fa';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    education: '',
    skills: '',
    projects: '',
    experience: '',
    certifications: '',
    objective: '',
    profileImage: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setFormData({
            fullName: data.fullName || '',
            email: data.email || currentUser.email || '',
            phone: data.phone || '',
            education: Array.isArray(data.education)
              ? data.education.map(e => `${e.degree} at ${e.institution} (${e.year})`).join('\n')
              : (typeof data.education === 'string' ? data.education : ''),
            skills: Array.isArray(data.skills) ? data.skills.join(', ') : (typeof data.skills === 'string' ? data.skills : ''),
            certifications: Array.isArray(data.certifications) ? data.certifications.join('\n') : (typeof data.certifications === 'string' ? data.certifications : ''),
            projects: Array.isArray(data.projects)
              ? data.projects.map(p => `${p.title}: ${p.description}`).join('\n')
              : (typeof data.projects === 'string' ? data.projects : ''),
            experience: Array.isArray(data.experience)
              ? data.experience.map(e => `${e.role} at ${e.company} (${e.duration})`).join('\n')
              : (typeof data.experience === 'string' ? data.experience : ''),
            objective: data.objective || '',
            profileImage: data.profileImage || ''
          });
        } else {
          setFormData(prev => ({ ...prev, email: currentUser.email }));
        }
      }
    });

    // Scroll listener for Go Up button
    const handleScroll = () => {
      setShowScroll(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setUploading(true);

    try {
      const apiKey = process.env.REACT_APP_IMGBB_API_KEY;
      if (!apiKey) throw new Error("ImgBB API Key not found in environment variables");

      if (imageFile) {
        const imageData = new FormData();
        imageData.append("image", imageFile);

        const uploadResponse = await axios.post(
          `https://api.imgbb.com/1/upload?key=${apiKey}`,
          imageData
        );

        const imageUrl = uploadResponse.data.data.url;
        formData.profileImage = imageUrl;
      }

      const parsedData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        education: formData.education.split('\n').map(line => {
          const match = line.match(/^(.+?) at (.+?) \((.+?)\)$/);
          return match ? { degree: match[1].trim(), institution: match[2].trim(), year: match[3].trim() } : null;
        }).filter(Boolean),
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        certifications: formData.certifications.split('\n').map(c => c.trim()).filter(Boolean),
        projects: formData.projects.split('\n').map(p => {
          const [title, ...descParts] = p.split(':');
          return { title: title.trim(), description: descParts.join(':').trim() };
        }).filter(p => p.title),
        experience: formData.experience.split('\n').map(e => {
          const match = e.match(/^(.+?) at (.+?) \((.+?)\)$/);
          return match ? { role: match[1].trim(), company: match[2].trim(), duration: match[3].trim() } : null;
        }).filter(Boolean),
        objective: formData.objective.trim(),
        profileImage: formData.profileImage
      };

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, parsedData, { merge: true });

      alert("✅ Profile saved!");
      setIsEditing(false);
    } catch (error) {
      console.error("❌ Error occurred while saving profile:", error);
      alert("Failed to save profile.");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      education: '',
      skills: '',
      projects: '',
      experience: '',
      certifications: '',
      objective: '',
      profileImage: ''
    });
    setImageFile(null);
    setPreviewImage('');
  };

  return (
    <div className="profile-wrapper">
      <div className="profile-card">
        <h2>Edit Profile</h2>

        {/* Info Section */}
        <div className="profile-info-box">
          <p>ℹ️ Keep your profile updated to build a strong AI-powered resume. Fill details about your education, projects, and skills. Upload a profile picture for better personalization.</p>
        </div>

        <button className="edit-btn" onClick={() => setIsEditing(!isEditing)}>
          <FaPen /> {isEditing ? "Cancel Edit" : "Edit"}
        </button>

        <div className="form">
          <label htmlFor="fullName">
            Full Name <span className="placeholder-hint">(e.g. John Doe)</span>
          </label>
          <input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} disabled={!isEditing} />

          <label htmlFor="email">
            Email <span className="placeholder-hint">(e.g. johndoe@email.com)</span>
          </label>
          <input id="email" name="email" value={formData.email} onChange={handleChange} disabled={!isEditing} />

          <label htmlFor="phone">
            Phone Number <span className="placeholder-hint">(e.g. +91 9876543210)</span>
          </label>
          <input id="phone" name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing} />

          <label htmlFor="education">
            Education <span className="placeholder-hint">(e.g. B.Sc in CS at XYZ University (2024))</span>
          </label>
          <textarea id="education" name="education" value={formData.education} onChange={handleChange} disabled={!isEditing} />

          <label htmlFor="skills">
            Skills <span className="placeholder-hint">(e.g. HTML, CSS, JavaScript)</span>
          </label>
          <textarea id="skills" name="skills" value={formData.skills} onChange={handleChange} disabled={!isEditing} />

          <label htmlFor="projects">
            Projects <span className="placeholder-hint">(e.g. Project Title: Description)</span>
          </label>
          <textarea id="projects" name="projects" value={formData.projects} onChange={handleChange} disabled={!isEditing} />

          <label htmlFor="experience">
            Experience <span className="placeholder-hint">(e.g. Developer at ABC Corp (2022-2024))</span>
          </label>
          <textarea id="experience" name="experience" value={formData.experience} onChange={handleChange} disabled={!isEditing} />

          <label htmlFor="certifications">
            Certifications <span className="placeholder-hint">(List each on a new line)</span>
          </label>
          <textarea id="certifications" name="certifications" value={formData.certifications} onChange={handleChange} disabled={!isEditing} />

          <label htmlFor="objective">
            Career Objective <span className="placeholder-hint">(Short and clear career goal)</span>
          </label>
          <textarea id="objective" name="objective" value={formData.objective} onChange={handleChange} disabled={!isEditing} />

          <label>Upload Profile Image</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <input type="file" accept="image/*" onChange={handleFileChange} disabled={!isEditing} />
            {(previewImage || formData.profileImage) && (
              <img
                src={previewImage || formData.profileImage}
                alt="Preview"
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'cover',
                  borderRadius: '50%',
                  border: '2px solid #ccc'
                }}
              />
            )}
          </div>

          {isEditing && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={saveProfile} disabled={uploading}>
                {uploading ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={resetForm}>
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Go Up Button */}
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
}
