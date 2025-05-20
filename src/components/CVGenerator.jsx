import React, { useState, useRef, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { useTheme } from '../context/ThemeContext';

const CVGenerator = ({ 
  personalInfo = {}, 
  education = [], 
  skills = {}, 
  experience = [], 
  otherSections = [],
  onPrint,
  allowEdit = true,
  jobDetails
}) => {
  const theme = useTheme();
  const iframeRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [hasChanges, setHasChanges] = useState(false);
  const [editedData, setEditedData] = useState({
    personalInfo,
    education,
    skills,
    experience,
    otherSections
  });
  
  // Auto-scrolling ref for editor
  const sectionsRef = {
    personal: useRef(null),
    education: useRef(null),
    skills: useRef(null),
    experience: useRef(null),
    other: useRef(null)
  };
  
  // Update local state when props change
  useEffect(() => {
    setEditedData({
      personalInfo,
      education,
      skills,
      experience,
      otherSections
    });
  }, [personalInfo, education, skills, experience, otherSections]);
  
  // Initialize iframe when component mounts
  useEffect(() => {
    console.log("Component mounted, iframe ref:", iframeRef.current);
    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (iframeRef.current) {
        console.log("Initializing iframe after timeout");
        renderCV();
        setIsReady(true);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  // Render the CV content to the iframe when data is available
  useEffect(() => {
    console.log("CV useEffect triggered", {
      iframeExists: !!iframeRef.current,
      firstName: editedData.personalInfo.firstName,
      lastName: editedData.personalInfo.lastName,
      isEditing
    });
    
    if (iframeRef.current && (editedData.personalInfo.firstName || editedData.personalInfo.lastName)) {
      console.log("About to render CV");
      renderCV();
      setIsReady(true);
    }
  }, [editedData, isEditing]);
  
  // Scroll to active section
  useEffect(() => {
    if (isEditing && sectionsRef[activeSection]?.current) {
      sectionsRef[activeSection].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSection, isEditing]);
  
  // Track changes to show save indicator
  const updateEditedData = (newData) => {
    setEditedData(newData);
    setHasChanges(true);
  };
  
  const renderCV = () => {
    console.log("renderCV function called");
    try {
      // Check if the iframe is accessible
      if (!iframeRef.current) {
        console.error("Iframe reference is null");
        return;
      }
      
      // Try to get the document
      let doc;
      try {
        doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
        if (!doc) {
          console.error("Could not access iframe document");
          return;
        }
      } catch (e) {
        console.error("Security exception when accessing iframe:", e);
        return;
      }
      
      // Generate the HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${editedData.personalInfo.firstName || ''} ${editedData.personalInfo.lastName || ''} CV</title>
          <style>
            @page {
              size: letter;
              margin: 0.3in;
            }
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: 'Helvetica Neue', Arial, sans-serif;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            body {
              background-color: #ffffff !important;
              color: #000000 !important;
              font-size: 9.5pt;
              line-height: 1.3;
              padding: 0;
              margin: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .container {
              max-width: 100%;
              padding: 12px 15px;
              background-color: #ffffff !important;
            }
            
            /* Header with name and contact info */
            .header {
              text-align: center;
              margin-bottom: 12px;
            }
            
            .name {
              font-size: 18pt;
              font-weight: 600;
              color: #204060 !important;
              margin-bottom: 3px;
            }
            
            .target-position {
              font-size: 11pt;
              font-weight: 500;
              color: #204060 !important;
              margin-bottom: 4px;
            }
            
            .location {
              font-size: 9pt;
              color: #000000 !important;
            }
            
            .contact-info {
              margin-top: 6px;
              font-size: 8.5pt;
              color: #000000 !important;
              display: flex;
              justify-content: center;
              align-items: center;
              flex-wrap: wrap;
              gap: 3px;
            }
            
            .contact-item {
              display: inline-block;
              margin: 0 6px;
              color: #000000 !important;
            }
            
            /* Section styling */
            .section {
              margin-bottom: 10px;
              page-break-inside: avoid;
            }
            
            .section-title {
              color: #204060 !important;
              font-size: 10.5pt;
              font-weight: 600;
              margin-bottom: 5px;
              padding-bottom: 1px;
              border-bottom: 1px solid #666666;
            }
            
            /* Entry styling (for education and experience) */
            .entry {
              margin-bottom: 6px;
              page-break-inside: avoid;
            }
            
            .entry-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1px;
            }
            
            .entry-title {
              font-weight: 700;
              font-size: 9.5pt;
              color: #000000 !important;
            }
            
            .entry-date {
              text-align: right;
              font-size: 9pt;
              color: #000000 !important;
            }
            
            .entry-subtitle {
              font-style: italic;
              font-size: 9pt;
              margin-bottom: 1px;
              color: #000000 !important;
            }
            
            /* Bullet points */
            .bullet-list {
              padding-left: 14px;
              margin-top: 1px;
              list-style-type: disc;
            }
            
            .bullet-item {
              margin-bottom: 0px;
              font-size: 9pt;
              color: #000000 !important;
              line-height: 1.2;
            }
            
            /* Skills section */
            .skills-grid {
              display: flex;
              flex-direction: column;
              gap: 1px;
            }
            
            .skill-category {
              display: flex;
              margin-bottom: 1px;
            }
            
            .skill-title {
              font-weight: 700;
              min-width: 90px;
              margin-right: 8px;
              color: #000000 !important;
            }
            
            .skill-content {
              flex: 1;
              color: #000000 !important;
            }
            
            /* Highlighted content */
            strong {
              font-weight: 700;
              color: #204060 !important;
              background-color: rgba(32, 64, 96, 0.05) !important;
              padding: 0 1px;
              border-radius: 2px;
            }
            
            /* Summary section */
            .summary {
              margin-bottom: 10px;
              font-size: 9pt;
              line-height: 1.3;
            }
            
            /* Career objective */
            .objective {
              margin-bottom: 10px;
              font-style: italic;
              color: #333333 !important;
            }
            
            /* Keywords section for ATS optimization */
            .keywords {
              margin-top: 5px;
              border-top: 1px dotted #cccccc;
              padding-top: 3px;
              font-size: 7.5pt;
              color: #666666 !important;
            }
            
            /* Match score indicator */
            .match-indicator {
              position: absolute;
              top: 10px;
              right: 10px;
              font-size: 8pt;
              color: #204060 !important;
              background: rgba(32, 64, 96, 0.1) !important;
              padding: 3px 5px;
              border-radius: 3px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${renderHeader()}
            ${renderObjective()}
            ${renderSummary()}
            ${renderSkills()}
            ${renderExperience()}
            ${renderEducation()}
            ${renderOtherSections()}
            ${renderKeywords()}
            ${renderAtsOptimizationNote()}
          </div>
        </body>
        </html>
      `;
      
      // Write the content to the iframe
      try {
        doc.open();
        doc.write(htmlContent);
        doc.close();
        console.log("CV rendered successfully");
      } catch (e) {
        console.error("Error writing to iframe document:", e);
        
        // Alternative method using srcdoc if write() fails
        try {
          iframeRef.current.srcdoc = htmlContent;
          console.log("CV rendered using srcdoc");
        } catch (e2) {
          console.error("Error setting srcdoc:", e2);
        }
      }
    } catch (error) {
      console.error("Error rendering CV:", error);
    }
  };
  
  const renderHeader = () => {
    const { firstName, lastName, city, country, phone, email, linkedin, github, website } = editedData.personalInfo;
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();
    const location = city && country ? `${city}, ${country}` : (city || country || '');
    
    // Add target position if job details are available
    const targetPosition = jobDetails && jobDetails.role 
      ? `<div class="target-position"><strong>Target Role:</strong> ${jobDetails.role}${jobDetails.company ? ` at ${jobDetails.company}` : ''}</div>` 
      : '';
    
    // Calculate match score if job details available
    const matchIndicator = jobDetails && jobDetails.role && hasJobMatchScore() 
      ? `<div class="match-indicator"><strong>Job Match Score:</strong> ${calculateJobMatchScore()}%</div>` 
      : '';
    
    return `
      <div class="header">
        ${matchIndicator}
        <div class="name">${fullName}</div>
        ${targetPosition}
        ${location ? `<div class="location">${location}</div>` : ''}
        <div class="contact-info">
          ${phone ? `<span class="contact-item">📞 ${phone}</span>` : ''}
          ${email ? `<span class="contact-item">✉️ ${email}</span>` : ''}
          ${linkedin ? `<span class="contact-item">LinkedIn: ${linkedin}</span>` : ''}
          ${github ? `<span class="contact-item">GitHub: ${github}</span>` : ''}
          ${website ? `<span class="contact-item">Web: ${website}</span>` : ''}
        </div>
      </div>
    `;
  };
  
  // Check if we can calculate a job match score
  const hasJobMatchScore = () => {
    return !!(jobDetails && 
            (jobDetails.requirements || 
             jobDetails.keyRequirement || 
             jobDetails.keySkills));
  };
  
  // Calculate approximate match score based on keyword frequency
  const calculateJobMatchScore = () => {
    if (!hasJobMatchScore()) return 0;
    
    // Extract keywords from job details
    const keywordsToMatch = [];
    
    if (jobDetails.keySkills) {
      keywordsToMatch.push(...jobDetails.keySkills.split(',').map(s => s.trim().toLowerCase()));
    }
    
    if (jobDetails.keyRequirement) {
      keywordsToMatch.push(...jobDetails.keyRequirement.split(',').map(s => s.trim().toLowerCase()));
    }
    
    if (jobDetails.requirements) {
      // Extract key terms from requirements
      const requirementWords = jobDetails.requirements
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 4) // Only include substantive words
        .filter(word => !['and', 'the', 'with', 'from', 'that', 'have', 'this', 'will'].includes(word));
      keywordsToMatch.push(...requirementWords);
    }
    
    if (jobDetails.role) {
      // Add job role keywords with higher weight
      const roleKeywords = jobDetails.role.toLowerCase().split(/\s+/);
      keywordsToMatch.push(...roleKeywords);
      keywordsToMatch.push(...roleKeywords); // Add twice for higher weight
    }
    
    if (keywordsToMatch.length === 0) return 0;
    
    // Extract all resume content for matching
    const resumeContent = [];
    
    // Add skills
    if (editedData.skills) {
      Object.entries(editedData.skills).forEach(([category, skills]) => {
        resumeContent.push(category.toLowerCase());
        if (typeof skills === 'string') {
          resumeContent.push(...skills.toLowerCase().split(',').map(s => s.trim()));
        } else if (Array.isArray(skills)) {
          resumeContent.push(...skills.map(s => s.toLowerCase()));
        }
      });
    }
    
    // Add experience
    if (editedData.experience) {
      editedData.experience.forEach(exp => {
        resumeContent.push(exp.title ? exp.title.toLowerCase() : '');
        resumeContent.push(exp.company ? exp.company.toLowerCase() : '');
        
        if (exp.achievements && Array.isArray(exp.achievements)) {
          exp.achievements.forEach(achievement => {
            resumeContent.push(...achievement.toLowerCase().split(/\s+/));
          });
        }
      });
    }
    
    // Add education
    if (editedData.education) {
      editedData.education.forEach(edu => {
        resumeContent.push(edu.degree ? edu.degree.toLowerCase() : '');
        resumeContent.push(edu.institution ? edu.institution.toLowerCase() : '');
        
        if (edu.details && Array.isArray(edu.details)) {
          edu.details.forEach(detail => {
            resumeContent.push(...detail.toLowerCase().split(/\s+/));
          });
        }
      });
    }
    
    // Count matches
    let matchCount = 0;
    keywordsToMatch.forEach(keyword => {
      if (resumeContent.some(text => text.includes(keyword) || keyword.includes(text))) {
        matchCount++;
      }
    });
    
    // Calculate score (60% baseline + up to 40% from matches)
    const baseScore = 60;
    const matchScore = keywordsToMatch.length > 0 
      ? Math.round((matchCount / keywordsToMatch.length) * 40) 
      : 0;
    
    return Math.min(99, baseScore + matchScore); // Cap at 99% to encourage continual improvement
  };
  
  // Add a professional summary section that highlights relevant experience
  const renderSummary = () => {
    if (!editedData.personalInfo.summary) return '';
    
    // Enhance summary with keyword highlighting if job details available
    let enhancedSummary = editedData.personalInfo.summary;
    
    if (jobDetails && (jobDetails.keyRequirement || jobDetails.keySkills || jobDetails.role)) {
      const keywordsToHighlight = [];
      
      if (jobDetails.keySkills) {
        keywordsToHighlight.push(...jobDetails.keySkills.split(',').map(s => s.trim()));
      }
      
      if (jobDetails.keyRequirement) {
        keywordsToHighlight.push(...jobDetails.keyRequirement.split(',').map(s => s.trim()));
      }
      
      if (jobDetails.role) {
        keywordsToHighlight.push(jobDetails.role);
      }
      
      // Highlight keywords in summary
      keywordsToHighlight.forEach(keyword => {
        if (!keyword || keyword.length < 4) return;
        
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        enhancedSummary = enhancedSummary.replace(regex, match => `<strong>${match}</strong>`);
      });
    }
    
    return `
      <div class="section">
        <h2 class="section-title">Professional Summary</h2>
        <div class="summary">
          ${enhancedSummary}
        </div>
      </div>
    `;
  };
  
  // Render keywords section for ATS optimization
  const renderKeywords = () => {
    if (!jobDetails || (!jobDetails.keyRequirement && !jobDetails.keySkills && !jobDetails.requirements)) return '';
    
    // Collect all possible keywords from resume
    const allKeywords = new Set();
    
    // Add skills
    if (editedData.skills) {
      Object.values(editedData.skills).forEach(skills => {
        if (typeof skills === 'string') {
          skills.split(',').map(s => s.trim()).forEach(skill => allKeywords.add(skill));
        } else if (Array.isArray(skills)) {
          skills.forEach(skill => allKeywords.add(skill));
        }
      });
    }
    
    // Add job titles
    if (editedData.experience) {
      editedData.experience.forEach(exp => {
        if (exp.title) allKeywords.add(exp.title);
      });
    }
    
    // Add education degrees
    if (editedData.education) {
      editedData.education.forEach(edu => {
        if (edu.degree) allKeywords.add(edu.degree);
      });
    }
    
    // Convert set to array
    const keywordsArray = Array.from(allKeywords);
    
    // Only render if we have keywords
    if (keywordsArray.length === 0) return '';
    
    return `
      <div class="keywords">
        <strong>Keywords:</strong> ${keywordsArray.join(', ')}
      </div>
    `;
  };
  
  // Add ATS optimization note
  const renderAtsOptimizationNote = () => {
    return '';
  };
  
  // Add a career objective that mentions the target role/company
  const renderObjective = () => {
    if (!jobDetails || !jobDetails.role) return '';
    
    const role = jobDetails.role || 'this position';
    const company = jobDetails.company || 'this company';
    
    // Extract relevant skills for this role
    const skillsArr = [];
    if (editedData.skills) {
      Object.entries(editedData.skills).forEach(([category, skills]) => {
        if (typeof skills === 'string') {
          skillsArr.push(...skills.split(',').map(s => s.trim()));
        } else if (Array.isArray(skills)) {
          skillsArr.push(...skills);
        }
      });
    }
    
    // Filter skills to those most relevant for this role
    const relevantSkills = skillsArr
      .filter(skill => 
        !jobDetails.keyRequirement || 
        jobDetails.keyRequirement.toLowerCase().includes(skill.toLowerCase()) || 
        (jobDetails.keySkills && jobDetails.keySkills.toLowerCase().includes(skill.toLowerCase()))
      )
      .slice(0, 3); // Limit to 3 most relevant skills
    
    const skillsPhrase = relevantSkills.length > 0 
      ? `with expertise in ${relevantSkills.join(', ')}` 
      : '';
    
    // More targeted objective statement mentioning the target role specifically
    return `
      <div class="objective">
        <strong>Career Objective:</strong> Results-driven ${editedData.personalInfo.title || 'professional'} ${skillsPhrase} seeking to leverage experience and skills for the <strong>${role}</strong> position at <strong>${company}</strong>, contributing directly to ${company}'s goals and objectives.
      </div>
    `;
  };
  
  const renderEducation = () => {
    if (!editedData.education || editedData.education.length === 0) return '';
    
    const educationEntries = editedData.education.map(edu => `
      <div class="entry">
        <div class="entry-header">
          <div class="entry-title">${edu.institution || ''}</div>
          <div class="entry-date">${edu.date || ''}</div>
        </div>
        <div class="entry-subtitle">
          ${edu.degree || ''}${edu.location ? `, ${edu.location}` : ''}
        </div>
        ${edu.details && edu.details.length > 0 ? `
          <ul class="bullet-list">
            ${edu.details.map(detail => `<li class="bullet-item">${detail}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `).join('');
    
    return `
      <div class="section">
        <h2 class="section-title">Education</h2>
        ${educationEntries}
      </div>
    `;
  };
  
  const renderSkills = () => {
    if (!editedData.skills || Object.keys(editedData.skills).length === 0) return '';
    
    // Check if we have job details to highlight relevant skills
    const hasJobDetails = jobDetails && 
                         (jobDetails.requirements || 
                          jobDetails.keyRequirement || 
                          jobDetails.role || 
                          jobDetails.keySkills);

    // Keywords to highlight from job details
    const keywordsToHighlight = [];
    
    if (hasJobDetails) {
      if (jobDetails.keySkills) {
        keywordsToHighlight.push(...jobDetails.keySkills.split(',').map(s => s.trim().toLowerCase()));
      }
      
      if (jobDetails.keyRequirement) {
        keywordsToHighlight.push(...jobDetails.keyRequirement.split(',').map(s => s.trim().toLowerCase()));
      }
      
      if (jobDetails.requirements) {
        // Extract key terms from requirements
        const requirementWords = jobDetails.requirements
          .toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 4); // Only include substantive words
        keywordsToHighlight.push(...requirementWords);
      }
      
      if (jobDetails.role) {
        keywordsToHighlight.push(jobDetails.role.toLowerCase());
      }
    }
    
    // Function to emphasize specific skills
    const emphasizeSkill = (skillText) => {
      if (!hasJobDetails || keywordsToHighlight.length === 0) return skillText;
      
      // For a comma-separated list of skills
      const skills = Array.isArray(skillText) ? skillText : skillText.split(',').map(s => s.trim());
      
      // Mark skills that match keywords with bold
      const enhancedSkills = skills.map(skill => {
        const skillLower = skill.toLowerCase();
        const isMatched = keywordsToHighlight.some(keyword => 
          skillLower.includes(keyword) || keyword.includes(skillLower)
        );
        
        return isMatched ? `<strong>${skill}</strong>` : skill;
      });
      
      return Array.isArray(skillText) ? enhancedSkills : enhancedSkills.join(', ');
    };
    
    // Sort skill categories to prioritize those matching job requirements
    const sortedCategories = Object.entries(editedData.skills);
    
    if (hasJobDetails && keywordsToHighlight.length > 0) {
      sortedCategories.sort(([categoryA, skillsA], [categoryB, skillsB]) => {
        // Calculate relevance score based on keyword matches
        const getRelevanceScore = (category, skills) => {
          let score = 0;
          
          // Check category name
          const categoryMatches = keywordsToHighlight.filter(keyword => 
            category.toLowerCase().includes(keyword)
          ).length;
          score += categoryMatches * 2; // Category matches are more important
          
          // Check skills
          const skillsText = Array.isArray(skills) ? skills.join(' ') : skills;
          const skillMatches = keywordsToHighlight.filter(keyword => 
            skillsText.toLowerCase().includes(keyword)
          ).length;
          score += skillMatches;
          
          return score;
        };
        
        return getRelevanceScore(categoryB, skillsB) - getRelevanceScore(categoryA, skillsA);
      });
    }
    
    const skillCategories = sortedCategories.map(([category, items]) => `
      <div class="skill-category">
        <div class="skill-title">${category}:</div>
        <div class="skill-content">${emphasizeSkill(Array.isArray(items) ? items.join(', ') : items)}</div>
      </div>
    `).join('');
    
    return `
      <div class="section">
        <h2 class="section-title">Technical Skills</h2>
        <div class="skills-grid">
          ${skillCategories}
        </div>
      </div>
    `;
  };
  
  const renderExperience = () => {
    if (!editedData.experience || editedData.experience.length === 0) return '';
    
    // Check if we have job details to highlight relevant experiences
    const hasJobDetails = jobDetails && 
                         (jobDetails.requirements || 
                          jobDetails.keyRequirement || 
                          jobDetails.role || 
                          jobDetails.keySkills);

    // Keywords to highlight from job details
    const keywordsToHighlight = [];
    
    if (hasJobDetails) {
      if (jobDetails.keySkills) {
        keywordsToHighlight.push(...jobDetails.keySkills.split(',').map(s => s.trim().toLowerCase()));
      }
      
      if (jobDetails.keyRequirement) {
        keywordsToHighlight.push(...jobDetails.keyRequirement.split(',').map(s => s.trim().toLowerCase()));
      }
      
      if (jobDetails.requirements) {
        // Extract key terms from requirements
        const requirementWords = jobDetails.requirements
          .toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 4); // Only include substantive words
        keywordsToHighlight.push(...requirementWords);
      }
      
      if (jobDetails.role) {
        keywordsToHighlight.push(jobDetails.role.toLowerCase());
      }
    }
    
    // Function to add emphasis to text that matches keywords
    const emphasizeKeywords = (text) => {
      if (!hasJobDetails || keywordsToHighlight.length === 0) return text;
      
      let emphasizedText = text;
      
      // Look for exact keyword matches
      keywordsToHighlight.forEach(keyword => {
        if (!keyword || keyword.length < 4) return;
        
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        emphasizedText = emphasizedText.replace(regex, match => `<strong>${match}</strong>`);
      });
      
      return emphasizedText;
    };
    
    // Sort experiences to prioritize those matching job requirements
    const sortedExperiences = [...editedData.experience];
    
    if (hasJobDetails && keywordsToHighlight.length > 0) {
      sortedExperiences.sort((a, b) => {
        // Calculate relevance score based on keyword matches
        const getRelevanceScore = (exp) => {
          let score = 0;
          
          // Check title
          const titleMatches = keywordsToHighlight.filter(keyword => 
            exp.title && exp.title.toLowerCase().includes(keyword)
          ).length;
          score += titleMatches * 2; // Title matches are more important
          
          // Check achievements
          if (exp.achievements && exp.achievements.length > 0) {
            const achievementMatches = exp.achievements.reduce((count, achievement) => {
              return count + keywordsToHighlight.filter(keyword => 
                achievement.toLowerCase().includes(keyword)
              ).length;
            }, 0);
            score += achievementMatches;
          }
          
          return score;
        };
        
        return getRelevanceScore(b) - getRelevanceScore(a);
      });
    }
    
    const experienceEntries = sortedExperiences.map(exp => `
      <div class="entry">
        <div class="entry-header">
          <div class="entry-title">${exp.title || ''}</div>
          <div class="entry-date">${exp.date || ''}</div>
        </div>
        <div class="entry-subtitle">
          ${exp.company || ''}${exp.location ? `, ${exp.location}` : ''}
        </div>
        ${exp.achievements && exp.achievements.length > 0 ? `
          <ul class="bullet-list">
            ${exp.achievements.map(achievement => `<li class="bullet-item">${emphasizeKeywords(achievement)}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `).join('');
    
    return `
      <div class="section">
        <h2 class="section-title">Relevant Experience</h2>
        ${experienceEntries}
      </div>
    `;
  };
  
  const renderOtherSections = () => {
    if (!editedData.otherSections || editedData.otherSections.length === 0) return '';
    
    return editedData.otherSections.map(section => `
      <div class="section">
        <h2 class="section-title">${section.title}</h2>
        ${section.entries.map(entry => `
          <div class="entry">
            ${entry.header ? `
              <div class="entry-header">
                <div class="entry-title">${entry.header.title || ''}</div>
                <div class="entry-date">${entry.header.date || ''}</div>
              </div>
            ` : ''}
            ${entry.subtitle ? `<div class="entry-subtitle">${entry.subtitle}</div>` : ''}
            ${entry.items && entry.items.length > 0 ? `
              <ul class="bullet-list">
                ${entry.items.map(item => `<li class="bullet-item">${item}</li>`).join('')}
              </ul>
            ` : entry.content ? `<p>${entry.content}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('');
  };
  
  // Handle print/save as PDF
  const handlePrint = () => {
    if (iframeRef.current) {
      if (onPrint) {
        onPrint();
      } else {
        iframeRef.current.contentWindow.print();
      }
    }
  };
  
  // Handle save as PDF with html2pdf
  const handleDownloadPDF = () => {
    if (!iframeRef.current) return;
    
    // Reference the iframe document and its container
    const iframeDoc = iframeRef.current.contentDocument;
    const element = iframeDoc.querySelector('.container');
    
    // First ensure all styles are properly loaded and applied
    const originalStyle = iframeDoc.head.querySelector('style').textContent;
    
    // Add extra styles to ensure text visibility in PDF
    const extraStyles = `
      * { 
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        color: #000000 !important;
        font-family: 'Helvetica Neue', Arial, sans-serif !important;
      }
      body, html { background-color: #ffffff !important; }
      .container { background-color: #ffffff !important; }
      .name { color: #2c5777 !important; }
      .section-title { color: #2c5777 !important; }
      svg, img { visibility: visible !important; }
    `;
    
    // Apply combined styles
    const styleEl = iframeDoc.createElement('style');
    styleEl.textContent = originalStyle + extraStyles;
    iframeDoc.head.appendChild(styleEl);
    
    // Cleanup function to reset styles after PDF generation
    const cleanup = () => {
      try {
        iframeDoc.head.removeChild(styleEl);
      } catch(e) {
        console.log('Cleanup error:', e);
      }
    };
    
    // Configure html2pdf options for high quality output
    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `${editedData.personalInfo.firstName || 'resume'}_${editedData.personalInfo.lastName || ''}.pdf`,
      image: { type: 'png', quality: 1.0 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: true,
        foreignObjectRendering: true,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait',
        compress: true,
        hotfixes: ["px_scaling"],
        precision: 16
      },
      pagebreak: { mode: 'avoid-all' }
    };
    
    // Show a loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.style.position = 'absolute';
    loadingDiv.style.top = '0';
    loadingDiv.style.left = '0';
    loadingDiv.style.width = '100%';
    loadingDiv.style.height = '100%';
    loadingDiv.style.display = 'flex';
    loadingDiv.style.alignItems = 'center';
    loadingDiv.style.justifyContent = 'center';
    loadingDiv.style.backgroundColor = 'rgba(255,255,255,0.8)';
    loadingDiv.style.zIndex = '1000';
    loadingDiv.innerHTML = '<div>Generating PDF...</div>';
    iframeRef.current.parentNode.appendChild(loadingDiv);
    
    // Use timeout to ensure DOM is fully rendered
    setTimeout(() => {
      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          // Remove loading indicator and cleanup
          if (loadingDiv.parentNode) {
            loadingDiv.parentNode.removeChild(loadingDiv);
          }
          cleanup();
        })
        .catch(err => {
          console.error('PDF generation error:', err);
          if (loadingDiv.parentNode) {
            loadingDiv.parentNode.removeChild(loadingDiv);
          }
          cleanup();
          
          // Fallback to window.print() if html2pdf fails
          alert('PDF generation encountered an error. Falling back to browser print dialog.');
          iframeRef.current.contentWindow.print();
        });
    }, 500);
  };
  
  // Handle entering edit mode
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  // Handle saving edits
  const handleSaveEdits = () => {
    setIsEditing(false);
    // Here you would typically call a callback to save the edited data
    // For now, we just use the local state to render the CV
  };
  
  // Render the CV editor UI
  const renderEditor = () => {
    return (
      <div className={`flex flex-col h-full ${theme.isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
        <div className={`p-3 border-b flex justify-between items-center ${theme.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
          <h3 className="font-medium">Edit Resume</h3>
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 text-sm rounded ${hasChanges ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-400 text-white'}`}
              onClick={handleSaveEdits}
              disabled={!hasChanges}
            >
              Save Changes
            </button>
            <button
              className="px-3 py-1 text-sm rounded bg-gray-500 hover:bg-gray-600 text-white"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Navigation */}
          <div className={`w-1/4 border-r ${theme.isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <nav className="p-2">
              <ul>
                {['personal', 'education', 'experience', 'skills', 'other'].map(section => (
                  <li key={section} className="mb-1">
                    <button 
                      className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                        activeSection === section
                          ? theme.isDarkMode
                            ? 'bg-blue-900 bg-opacity-50 text-blue-200'
                            : 'bg-blue-100 text-blue-800'
                          : theme.isDarkMode
                            ? 'hover:bg-gray-800 text-gray-300'
                            : 'hover:bg-gray-200 text-gray-700'
                      }`}
                      onClick={() => setActiveSection(section)}
                    >
                      {section.charAt(0).toUpperCase() + section.slice(1)} Information
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          
          {/* Form fields for the active section */}
          <div className={`w-3/4 overflow-auto p-4 ${theme.isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {activeSection === 'personal' && (
              <div ref={sectionsRef.personal}>
                <h4 className="text-lg font-medium mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      First Name
                    </label>
                    <input
                      type="text"
                      className={`block w-full rounded border px-3 py-2 ${
                        theme.isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-200' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      value={editedData.personalInfo.firstName || ''}
                      onChange={e => {
                        const updated = {
                          ...editedData,
                          personalInfo: {
                            ...editedData.personalInfo,
                            firstName: e.target.value
                          }
                        };
                        updateEditedData(updated);
                      }}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      className={`block w-full rounded border px-3 py-2 ${
                        theme.isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-200' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      value={editedData.personalInfo.lastName || ''}
                      onChange={e => {
                        const updated = {
                          ...editedData,
                          personalInfo: {
                            ...editedData.personalInfo,
                            lastName: e.target.value
                          }
                        };
                        updateEditedData(updated);
                      }}
                    />
                  </div>
                  
                  {/* Add similar styled input fields for the rest of the personal details */}
                  {/* ... */}
                </div>
              </div>
            )}
            
            {/* Implement other sections with similar theme-aware styling */}
            {/* ... */}
          </div>
        </div>
      </div>
    );
  };
  
  // Main component UI
  return (
    <div className={`w-full border rounded-lg overflow-hidden flex flex-col ${theme.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className={`p-3 border-b flex justify-between items-center ${theme.isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <h2 className={`text-lg font-medium ${theme.isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Resume Preview</h2>
        <div className="flex space-x-2">
          {allowEdit && !isEditing && (
            <button 
              className={`px-3 py-1 text-sm rounded border ${
                theme.isDarkMode 
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200' 
                  : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
              }`}
              onClick={handleEdit}
            >
              Edit Resume
            </button>
          )}
          <button 
            className="px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600"
            onClick={handleDownloadPDF}
            disabled={!isReady}
          >
            Download PDF
          </button>
        </div>
      </div>
      
      {isEditing ? (
        renderEditor()
      ) : (
        <div className="flex-grow relative" style={{ minHeight: '600px', border: '1px solid yellow' }}>
          <iframe 
            ref={iframeRef}
            className="absolute inset-0 w-full h-full border-none"
            title="Resume Preview"
            style={{ display: 'block' }}
          />
        </div>
      )}
    </div>
  );
};

export default CVGenerator; 