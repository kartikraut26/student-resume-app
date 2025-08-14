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
    setImageFile(e.target.files[0]);
  };

  const saveProfile = async () => {
    if (!user) return;
    setUploading(true);

    try {
      const apiKey = process.env.REACT_APP_IMGBB_API_KEY;

      if (!apiKey) {
        throw new Error("ImgBB API Key not found in environment variables");
      }

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
          return match ? {
            degree: match[1].trim(),
            institution: match[2].trim(),
            year: match[3].trim()
          } : null;
        }).filter(Boolean),
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        certifications: formData.certifications.split('\n').map(c => c.trim()).filter(Boolean),
        projects: formData.projects.split('\n').map(p => {
          const [title, ...descParts] = p.split(':');
          return {
            title: title.trim(),
            description: descParts.join(':').trim()
          };
        }).filter(p => p.title),
        experience: formData.experience.split('\n').map(e => {
          const match = e.match(/^(.+?) at (.+?) \((.+?)\)$/);
          return match ? {
            role: match[1].trim(),
            company: match[2].trim(),
            duration: match[3].trim()
          } : null;
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

  return (
    <div className="profile-wrapper">
      <h2>Edit Profile</h2>
      <div className="form">
        <input name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} />
        <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
        <input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
        <textarea name="education" placeholder="Education" value={formData.education} onChange={handleChange} />
        <textarea name="skills" placeholder="Skills" value={formData.skills} onChange={handleChange} />
        <textarea name="projects" placeholder="Projects" value={formData.projects} onChange={handleChange} />
        <textarea name="experience" placeholder="Experience" value={formData.experience} onChange={handleChange} />
        <textarea name="certifications" placeholder="Certifications" value={formData.certifications} onChange={handleChange} />
        <textarea name="objective" placeholder="Career Objective" value={formData.objective} onChange={handleChange} />
        <label>Upload Profile Image</label>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button onClick={saveProfile} disabled={uploading}>
          {uploading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
