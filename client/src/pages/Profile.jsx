import React, { useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import './Profile.css';
import axios from 'axios';

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

    return () => unsubscribe();
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
        setPreviewImage(reader.result); // Base64 preview
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
        <div className="form">
          <label htmlFor="fullName">Full Name</label>
          <input id="fullName" name="fullName" placeholder="e.g. John Doe" value={formData.fullName} onChange={handleChange} />
          
          <label htmlFor="email">Email</label>
          <input id="email" name="email" placeholder="e.g. johndoe@email.com" value={formData.email} onChange={handleChange} />
          
          <label htmlFor="phone">Phone Number</label>
          <input id="phone" name="phone" placeholder="e.g. +91 9876543210" value={formData.phone} onChange={handleChange} />
          
          <label htmlFor="education">Education</label>
          <textarea id="education" name="education" placeholder="e.g. B.Sc in CS at XYZ University (2024)" value={formData.education} onChange={handleChange} />
          
          <label htmlFor="skills">Skills</label>
          <textarea id="skills" name="skills" placeholder="e.g. HTML, CSS, JavaScript" value={formData.skills} onChange={handleChange} />
          
          <label htmlFor="projects">Projects</label>
          <textarea id="projects" name="projects" placeholder="e.g. Project Title: Description" value={formData.projects} onChange={handleChange} />
          
          <label htmlFor="experience">Experience</label>
          <textarea id="experience" name="experience" placeholder="e.g. Developer at ABC Corp (2022-2024)" value={formData.experience} onChange={handleChange} />
          
          <label htmlFor="certifications">Certifications</label>
          <textarea id="certifications" name="certifications" placeholder="List each on a new line" value={formData.certifications} onChange={handleChange} />
          
          <label htmlFor="objective">Career Objective</label>
          <textarea id="objective" name="objective" placeholder="Short and clear career goal" value={formData.objective} onChange={handleChange} />
          
          <label>Upload Profile Image</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <input type="file" accept="image/*" onChange={handleFileChange} />
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

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={saveProfile} disabled={uploading}>
              {uploading ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={resetForm}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
