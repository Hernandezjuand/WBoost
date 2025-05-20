/**
 * Formats AI-generated resume content into structured data for the CV generator
 */

/**
 * Extracts and formats personal information from resume content
 * @param {string} content - AI-generated resume content
 * @returns {Object} Formatted personal information
 */
export const extractPersonalInfo = (content) => {
  const personalInfo = {
    firstName: '',
    lastName: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    linkedin: ''
  };

  // Try to extract name
  const nameMatch = content.match(/\\name\{([^}]+)\}\{([^}]+)\}/);
  if (nameMatch) {
    personalInfo.firstName = nameMatch[1];
    personalInfo.lastName = nameMatch[2];
  } else {
    // Alternative extraction method if not using LaTeX
    const nameRegex = /name:?\s*([\w\s]+)/i;
    const nameMatch = content.match(nameRegex);
    if (nameMatch && nameMatch[1]) {
      const nameParts = nameMatch[1].trim().split(/\s+/);
      if (nameParts.length >= 2) {
        personalInfo.firstName = nameParts[0];
        personalInfo.lastName = nameParts.slice(1).join(' ');
      } else if (nameParts.length === 1) {
        personalInfo.firstName = nameParts[0];
      }
    }
  }

  // Extract address
  const addressMatch = content.match(/\\address\{([^}]+)\}\{([^}]+)\}/);
  if (addressMatch) {
    personalInfo.city = addressMatch[1];
    personalInfo.country = addressMatch[2];
  } else {
    // Alternative extraction
    const locationRegex = /location:?\s*([\w\s,]+)/i;
    const locationMatch = content.match(locationRegex);
    if (locationMatch && locationMatch[1]) {
      const parts = locationMatch[1].split(',').map(p => p.trim());
      if (parts.length >= 2) {
        personalInfo.city = parts[0];
        personalInfo.country = parts[1];
      } else if (parts.length === 1) {
        personalInfo.city = parts[0];
      }
    }
  }

  // Extract phone number
  const phoneMatch = content.match(/\\phone\[mobile\]\{([^}]+)\}/) || 
                    content.match(/phone:?\s*([\+\d\s\-\(\)]+)/i);
  if (phoneMatch) {
    personalInfo.phone = phoneMatch[1].trim();
  }

  // Extract email
  const emailMatch = content.match(/\\email\{([^}]+)\}/) || 
                    content.match(/email:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) {
    personalInfo.email = emailMatch[1].trim();
  }

  // Extract LinkedIn
  const linkedinMatch = content.match(/\\social\[linkedin\]\{([^}]+)\}/) || 
                       content.match(/linkedin:?\s*([\w\s\/\.\-]+)/i);
  if (linkedinMatch) {
    personalInfo.linkedin = linkedinMatch[1].trim();
  }

  return personalInfo;
};

/**
 * Extracts and formats education information
 * @param {string} content - AI-generated resume content
 * @returns {Array} Array of education entries
 */
export const extractEducation = (content) => {
  const education = [];
  
  // Find Education section
  const educationSectionMatch = content.match(/\\section\{Education\}([^]*?)(?=\\section\{|$)/i) ||
                               content.match(/education[:\n]([^]*?)(?=skills|experience|projects|$)/i);
  
  if (!educationSectionMatch) return education;
  
  const educationSection = educationSectionMatch[1];
  
  // Extract education entries - try LaTeX format first
  const cvEntryRegex = /\\cventry\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g;
  let entryMatch;
  
  while ((entryMatch = cvEntryRegex.exec(educationSection)) !== null) {
    education.push({
      date: entryMatch[1],
      degree: entryMatch[2],
      institution: entryMatch[3],
      location: entryMatch[4],
      details: []
    });
  }
  
  // If no entries found via LaTeX format, try alternative extraction
  if (education.length === 0) {
    // Look for patterns like "University Name, Location | Degree | Date"
    const eduEntryRegex = /(\d{4}\s*[-–]\s*(?:\d{4}|present|ongoing))\s*(.+?)\s*,\s*(.+?)(?:\s*\|\s*|\n)/gi;
    const altEduMatches = [...educationSection.matchAll(eduEntryRegex)];
    
    for (const match of altEduMatches) {
      const [_, date, institution, locationOrDegree] = match;
      education.push({
        date,
        institution,
        location: locationOrDegree.includes(',') ? locationOrDegree.split(',')[0].trim() : '',
        degree: locationOrDegree.includes(',') ? locationOrDegree.split(',')[1].trim() : locationOrDegree,
        details: []
      });
    }
  }
  
  return education;
};

/**
 * Extracts and formats skills information
 * @param {string} content - AI-generated resume content
 * @returns {Object} Structured skills object
 */
export const extractSkills = (content) => {
  const skills = {};
  
  // Find Skills section
  const skillsSectionMatch = content.match(/\\section\{(Technical\s*)?Skills\}([^]*?)(?=\\section\{|$)/i) ||
                            content.match(/(technical\s*)?skills[:\n]([^]*?)(?=education|experience|projects|$)/i);
  
  if (!skillsSectionMatch) return skills;
  
  const skillsSection = skillsSectionMatch[skillsSectionMatch.length - 1]; // Last capturing group
  
  // Try LaTeX format first
  const cvItemRegex = /\\cvitem\{([^}]+)\}\{([^}]+)\}/g;
  let itemMatch;
  
  while ((itemMatch = cvItemRegex.exec(skillsSection)) !== null) {
    const category = itemMatch[1].trim();
    const items = itemMatch[2].trim();
    skills[category] = items;
  }
  
  // If no entries found via LaTeX format, try alternative extraction
  if (Object.keys(skills).length === 0) {
    // Look for patterns like "Category: Item1, Item2, Item3"
    const skillCategoryRegex = /(\w+(?:\s+\w+)*):\s*([^\n]+)/g;
    let categoryMatch;
    
    while ((categoryMatch = skillCategoryRegex.exec(skillsSection)) !== null) {
      const category = categoryMatch[1].trim();
      const items = categoryMatch[2].trim();
      skills[category] = items;
    }
  }
  
  // If still empty, look for general skills list
  if (Object.keys(skills).length === 0) {
    const skillsList = skillsSection.split(/[,•]/).map(skill => skill.trim()).filter(Boolean);
    if (skillsList.length > 0) {
      skills['Skills'] = skillsList.join(', ');
    }
  }
  
  return skills;
};

/**
 * Extracts and formats experience information
 * @param {string} content - AI-generated resume content 
 * @returns {Array} Array of experience entries
 */
export const extractExperience = (content) => {
  const experience = [];
  
  // Find Experience section
  const expSectionMatch = content.match(/\\section\{(?:Relevant\s*)?Experience\}([^]*?)(?=\\section\{|$)/i) ||
                         content.match(/(?:relevant\s*)?experience[:\n]([^]*?)(?=education|skills|projects|$)/i);
  
  if (!expSectionMatch) return experience;
  
  const expSection = expSectionMatch[1];
  
  // Extract experience entries - try LaTeX format first
  const cvEntryRegex = /\\cventry\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*?(?:\\begin\{itemize\}[^]*?\\end\{itemize\})?)\}/g;
  let entryMatch;
  
  while ((entryMatch = cvEntryRegex.exec(expSection)) !== null) {
    const entry = {
      date: entryMatch[1],
      title: entryMatch[2],
      company: entryMatch[3],
      location: entryMatch[4],
      achievements: []
    };
    
    // Extract bullet points
    const description = entryMatch[6];
    const itemRegex = /\\item\s+([^\\]+)/g;
    let itemMatch;
    
    while ((itemMatch = itemRegex.exec(description)) !== null) {
      entry.achievements.push(itemMatch[1].trim());
    }
    
    experience.push(entry);
  }
  
  // If no entries found via LaTeX format, try alternative extraction
  if (experience.length === 0) {
    // Look for patterns like "Company Name, Location | Title | Date"
    const expEntryRegex = /(\d{4}\s*[-–]\s*(?:\d{4}|present|ongoing))\s*(.+?)\s*(?:\((.+?)\))?\s*,\s*(.+?)(?:\n|$)/gi;
    const altExpMatches = [...expSection.matchAll(expEntryRegex)];
    
    for (const match of altExpMatches) {
      const [fullMatch, date, company, title, location] = match;
      const expEntry = {
        date,
        company,
        title: title || '',
        location,
        achievements: []
      };
      
      // Find bullet points that follow this position
      const bulletRegex = /•\s*([^\n•]+)/g;
      const bulletSection = expSection.substring(expSection.indexOf(fullMatch) + fullMatch.length);
      let bulletMatch;
      
      let count = 0;
      while ((bulletMatch = bulletRegex.exec(bulletSection)) !== null && count < 10) {
        expEntry.achievements.push(bulletMatch[1].trim());
        count++;
        if (count > 5 && bulletSection.indexOf('•', bulletMatch.index + 1) > bulletSection.indexOf('\n\n', bulletMatch.index + 1)) {
          break; // Stop if we find a paragraph break before the next bullet
        }
      }
      
      experience.push(expEntry);
    }
  }
  
  return experience;
};

/**
 * Extracts and formats projects and other sections
 * @param {string} content - AI-generated resume content
 * @returns {Array} Array of additional sections
 */
export const extractOtherSections = (content) => {
  const otherSections = [];
  
  // Common additional sections
  const sectionNames = [
    'Projects', 'Awards', 'Publications', 'Certifications', 
    'Volunteer Experience', 'Activities', 'Interests'
  ];
  
  for (const sectionName of sectionNames) {
    // Try to find the section using LaTeX pattern
    const sectionMatch = content.match(new RegExp(`\\\\section\\{(?:${sectionName}|${sectionName} ?\\& ?Awards)\\}([^]*?)(?=\\\\section\\{|$)`, 'i')) ||
                        content.match(new RegExp(`${sectionName}[:\\n]([^]*?)(?=education|skills|experience|projects|certifications|${sectionNames.join('|')}|$)`, 'i'));
    
    if (!sectionMatch) continue;
    
    const sectionContent = sectionMatch[1];
    const section = {
      title: sectionName,
      entries: []
    };
    
    // Try LaTeX format first (cventry)
    const cvEntryRegex = /\\cventry\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*?(?:\\begin\{itemize\}[^]*?\\end\{itemize\})?)\}/g;
    let entryMatch;
    
    while ((entryMatch = cvEntryRegex.exec(sectionContent)) !== null) {
      const entry = {
        header: {
          title: entryMatch[2],
          date: entryMatch[1]
        },
        subtitle: `${entryMatch[3]}${entryMatch[4] ? ', ' + entryMatch[4] : ''}`,
        items: []
      };
      
      // Extract bullet points
      const description = entryMatch[6];
      const itemRegex = /\\item\s+([^\\]+)/g;
      let itemMatch;
      
      while ((itemMatch = itemRegex.exec(description)) !== null) {
        entry.items.push(itemMatch[1].trim());
      }
      
      section.entries.push(entry);
    }
    
    // If no entries found, try alternative extraction
    if (section.entries.length === 0) {
      // Look for project/award entries in non-LaTeX format
      const entryRegex = /(\d{4}(?:\s*[-–]\s*\d{4})?)\s*(.+?)(?:\s*,\s*|\s*\|\s*)(.+?)(?:\n|$)/gi;
      const matches = [...sectionContent.matchAll(entryRegex)];
      
      for (const match of matches) {
        const [fullMatch, date, title, description] = match;
        const entry = {
          header: {
            title,
            date
          },
          subtitle: description,
          items: []
        };
        
        // Find bullet points that follow this entry
        const bulletRegex = /•\s*([^\n•]+)/g;
        const bulletSection = sectionContent.substring(sectionContent.indexOf(fullMatch) + fullMatch.length);
        let bulletMatch;
        
        let count = 0;
        while ((bulletMatch = bulletRegex.exec(bulletSection)) !== null && count < 5) {
          entry.items.push(bulletMatch[1].trim());
          count++;
          if (bulletSection.indexOf('•', bulletMatch.index + 1) > bulletSection.indexOf('\n\n', bulletMatch.index + 1)) {
            break; // Stop if we find a paragraph break before the next bullet
          }
        }
        
        section.entries.push(entry);
      }
    }
    
    // Only add the section if it has entries
    if (section.entries.length > 0) {
      otherSections.push(section);
    }
  }
  
  return otherSections;
};

/**
 * Formats all resume data for the CV Generator
 * @param {string} content - AI-generated resume content
 * @returns {Object} Structured data for CV Generator
 */
export const formatResumeData = (content) => {
  return {
    personalInfo: extractPersonalInfo(content),
    education: extractEducation(content),
    skills: extractSkills(content),
    experience: extractExperience(content),
    otherSections: extractOtherSections(content)
  };
};

export default formatResumeData; 