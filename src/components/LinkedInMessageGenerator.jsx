import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { useTheme } from '../context/ThemeContext';

const LinkedInMessageGenerator = ({
  personalInfo = {},
  resume = {},
  jobDetails = {},
}) => {
  const theme = useTheme();
  const [expandedSection, setExpandedSection] = useState('recruiter');
  const [editingSections, setEditingSections] = useState({});
  const [customMessages, setCustomMessages] = useState({});
  const [messages, setMessages] = useState({
    recruiter: '',
    hiringManager: '',
    teamMember: '',
    alumni: '',
    industry: ''
  });
  const [selectedTemplates, setSelectedTemplates] = useState({});
  const messageRefs = {
    recruiter: useRef(null),
    hiringManager: useRef(null),
    teamMember: useRef(null),
    alumni: useRef(null),
    industry: useRef(null)
  };
  const [copiedSection, setCopiedSection] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    // Auto-generate all messages on component mount
    generateAllMessages();
  }, [resume, jobDetails]);
  
  // Helper for extracting skills from resume (simplified)
  const extractTopSkills = (resume) => {
    if (!resume || !resume.skills) return [];
    
    // Flatten skills from all categories
    const allSkills = Object.values(resume.skills || {}).flatMap(skillSet => {
      if (typeof skillSet === 'string') {
        return skillSet.split(',').map(s => s.trim());
      }
      return skillSet || [];
    });
    
    // Return top 3 skills or all if less than 3
    return allSkills.slice(0, 3);
  };
  
  // Extract most recent job title from resume
  const extractCurrentRole = (resume) => {
    if (!resume || !resume.experience || resume.experience.length === 0) {
      return '';
    }
    
    return resume.experience[0].title || '';
  };

  // Extract key achievements from resume
  const extractAchievements = (resume) => {
    if (!resume || !resume.experience || resume.experience.length === 0) {
      return [];
    }
    
    // Collect achievements from the most recent jobs
    const achievements = [];
    
    for (let i = 0; i < Math.min(2, resume.experience.length); i++) {
      const job = resume.experience[i];
      if (job.achievements && job.achievements.length > 0) {
        achievements.push(...job.achievements.slice(0, 2));
      }
    }
    
    return achievements.length > 0 ? achievements : ['[Add a specific achievement]'];
  };

  // Extract years of experience in relevant field
  const extractYearsOfExperience = (resume) => {
    if (!resume || !resume.experience || resume.experience.length === 0) {
      return '5+';
    }
    
    // Simple estimation based on number of jobs
    const jobCount = resume.experience.length;
    return jobCount <= 2 ? '2+' : jobCount <= 4 ? '5+' : '10+';
  };
  
  // Generate templates based on job and resume data
  const generateTemplates = () => {
    // Extract basic info to use in templates
    const name = `${personalInfo.firstName || 'your first name'} ${personalInfo.lastName || 'your last name'}`;
    const company = jobDetails.company || '[Company Name]';
    const role = jobDetails.role || '[Job Title]';
    const skills = extractTopSkills(resume);
    const currentRole = extractCurrentRole(resume);
    const achievements = extractAchievements(resume);
    const yearsExperience = extractYearsOfExperience(resume);
    
    // Try to extract specific requirements from job details
    const keyRequirement = jobDetails.keyRequirement || '[key job requirement]';
    const keySkills = jobDetails.keySkills ? jobDetails.keySkills.split(',').map(s => s.trim()) : ['[key skill]'];
    const industry = jobDetails.industry || '[industry]';
    const companyFocus = jobDetails.companyFocus || industry || company + "'s focus area";
    const requirements = jobDetails.requirements || '';
    
    // Extract secondary key requirements from full requirements text
    const secondaryRequirement = keySkills[1] || '[secondary requirement]';
    
    // Extract team challenges from job description
    const teamChallenge = requirements.includes('challenge') 
      ? requirements.split('.').find(s => s.toLowerCase().includes('challenge')) || '[team challenge]'
      : jobDetails.teamChallenge || '[team challenge]';
    
    // Prepare achievement snippets
    const topAchievement = achievements[0] || '[specific achievement]';
    const achievementSnippet = topAchievement.length > 50 
      ? topAchievement.substring(0, 50) + '...' 
      : topAchievement;
    
    // Check if this is a sales/marketing/business development role
    const isSalesRole = role.toLowerCase().includes('sales') || 
                        role.toLowerCase().includes('account manager') || 
                        role.toLowerCase().includes('business development') ||
                        role.toLowerCase().includes('marketing') ||
                        company.toLowerCase().includes('sales');
    
    // Sales-specific template enhancements if appropriate
    const salesAchievement = isSalesRole 
      ? (achievements.find(a => a.toLowerCase().includes('revenue') || a.toLowerCase().includes('sales') || a.toLowerCase().includes('%')) || 
         'achieved 120% of quota')
      : achievementSnippet;
      
    const salesMetric = isSalesRole 
      ? 'consistently exceeded quarterly targets' 
      : '[specific measurable achievement]';
      
    const salesValue = isSalesRole 
      ? 'track record of expanding client relationships and generating revenue' 
      : 'experience';
    
    // Technical role enhancements
    const isTechRole = role.toLowerCase().includes('develop') || 
                       role.toLowerCase().includes('engineer') || 
                       role.toLowerCase().includes('data') || 
                       role.toLowerCase().includes('tech');
                       
    const techFocus = isTechRole ? (keySkills[0] || 'technology') : keyRequirement;
    
    return {
      recruiter: [
        {
          title: "Direct & Concise",
          message: `Hi [Name],

I'm applying for the ${role} position at ${company}. My background in ${keyRequirement} and ${skills[0] || 'relevant skills'} aligns with your requirements. 

Most recently, I ${achievements[0]?.substring(0, 60) || 'achieved significant results in my current role'}.

Would you be open to a brief conversation?

Thanks,
${name}`
        },
        {
          title: "Results-Focused",
          message: `Hi [Name],

I'm interested in the ${role} role at ${company}. In my ${yearsExperience} years as ${currentRole}, I've delivered ${isSalesRole ? salesAchievement : 'measurable results'} using expertise in ${keyRequirement}.

Are you available for a quick call to discuss how I can add value to your team?

Best,
${name}`
        }
      ],
      
      hiringManager: [
        {
          title: "Problem-Solver",
          message: `Hi [Name],

I've applied for the ${role} role at ${company}. My experience with ${keyRequirement} and ${secondaryRequirement} matches your team's needs.

I can contribute immediately through my proven ability to ${achievements[0]?.substring(0, 60) || 'solve complex problems'}.

Could we discuss how my background fits your requirements?

Regards,
${name}`
        },
        {
          title: "Quick Value Prop",
          message: `Hi [Name],

I'm excited about the ${role} position. I bring:
• Experience in ${keyRequirement}
• Track record of ${achievements[0]?.substring(0, 40) || 'delivering results'}
• Skills in ${skills.slice(0, 2).join(', ')}

Would you be open to a brief conversation about your team's needs?

Best,
${name}`
        }
      ],
      
      teamMember: [
        {
          title: "Peer Connection",
          message: `Hi [Name],

I'm applying for the ${role} position at ${company} and saw you work on the team.

Could you share insights about working with ${keyRequirement} in your role? I have experience in this area and would value your perspective.

Thanks,
${name}`
        },
        {
          title: "Team Insight",
          message: `Hi [Name],

I'm interested in the ${role} role at ${company}. 

What's been your experience addressing ${teamChallenge.replace('[team challenge]', 'challenges in your area')}? I'd appreciate any insights before my application process continues.

Thank you,
${name}`
        }
      ],
      
      alumni: [
        {
          title: "School Connection",
          message: `Hi [Name],

Fellow [School] alum here! I've applied for the ${role} role at ${company}. 

How has your experience been there? I'm particularly interested in the team's approach to ${keyRequirement}.

Thanks for any insights,
${name}`
        },
        {
          title: "Quick Alumni Check",
          message: `Hi [Name],

[School] connection! I'm applying for ${role} at ${company}.

Would you be open to a quick chat about the company culture and how my background in ${skills[0] || 'relevant skills'} might fit?

Thanks,
${name}`
        }
      ],
      
      industry: [
        {
          title: "Industry Expertise",
          message: `Hi [Name],

I noticed your work in ${companyFocus} and I'm applying for the ${role} role at ${company}.

I have experience with ${keyRequirement} and would value connecting to discuss industry trends and opportunities.

Regards,
${name}`
        },
        {
          title: "Quick Industry Connect",
          message: `Hi [Name],

Your expertise in ${keyRequirement} caught my attention. I'm exploring the ${role} position at ${company} and have relevant experience in ${skills[0] || 'this area'}.

Would you be open to a brief professional connection?

Thank you,
${name}`
        }
      ]
    };
  };

  // Auto-generate all messages using the first template for each type
  const generateAllMessages = () => {
    setIsGenerating(true);
    
    const templates = generateTemplates();
    const newMessages = {};
    const newSelectedTemplates = {};
    
    // Create a message for each recipient type using the first template
    Object.entries(templates).forEach(([type, templatesList]) => {
      if (templatesList.length > 0) {
        newMessages[type] = templatesList[0].message;
        newSelectedTemplates[type] = 0;
      }
    });
    
    setMessages(newMessages);
    setSelectedTemplates(newSelectedTemplates);
    setIsGenerating(false);
  };
  
  // Generate personalized tips based on recipient type
  const getTipsForType = (type) => {
    const tips = {
      recruiter: [
        "Keep your message under 300 characters for higher response rates",
        "Mention the exact job title and keywords from the job posting",
        "Highlight skills that directly match the requirements in the job description",
        "Include specific metrics or achievements relevant to the role"
      ],
      hiringManager: [
        "Research the hiring manager's team projects or initiatives before reaching out",
        "Reference specific job requirements and how your experience aligns",
        "Demonstrate understanding of the team's challenges or industry trends",
        "Focus on how you can add immediate value to their specific needs"
      ],
      teamMember: [
        "Ask specific questions about the role's day-to-day responsibilities",
        "Reference technologies or methodologies mentioned in the job description",
        "Show how your experience relates to the team's current projects",
        "Express genuine interest in their role within the context of your job search"
      ],
      alumni: [
        "Lead with the shared school connection, then transition to the job opportunity",
        "Mention specific skills from the job description that match your experience",
        "Ask for insights about the company culture and team dynamics",
        "Reference how your background prepares you for the specific role"
      ],
      industry: [
        "Reference specific industry challenges mentioned in the job description",
        "Highlight your expertise in areas directly related to the role",
        "Ask thoughtful questions about industry trends relevant to the position",
        "Demonstrate knowledge of the company's position in the market"
      ]
    };

    return tips[type] || [];
  };
  
  // Get recipient type label
  const getRecipientLabel = (type) => {
    switch(type) {
      case 'recruiter': return 'Recruiter';
      case 'hiringManager': return 'Hiring Manager';
      case 'teamMember': return 'Team Member';
      case 'alumni': return 'School Alumni';
      case 'industry': return 'Industry Expert';
      default: return 'Recipient';
    }
  };
  
  // Get recipient icon
  const getRecipientIcon = (type) => {
    switch(type) {
      case 'recruiter': return '👩‍💼';
      case 'hiringManager': return '👨‍💼';
      case 'teamMember': return '👥';
      case 'alumni': return '🎓';
      case 'industry': return '🔬';
      default: return '👤';
    }
  };

  // Toggle edit mode for a section
  const toggleEdit = (section) => {
    if (editingSections[section]) {
      // Save edits
      setMessages({
        ...messages,
        [section]: customMessages[section] || messages[section]
      });
      
      setEditingSections({
        ...editingSections,
        [section]: false
      });
    } else {
      // Enter edit mode
      setCustomMessages({
        ...customMessages,
        [section]: messages[section]
      });
      
      setEditingSections({
        ...editingSections,
        [section]: true
      });
    }
  };

  // Update custom message text
  const updateCustomMessage = (section, text) => {
    setCustomMessages({
      ...customMessages,
      [section]: text
    });
  };
  
  // Copy message to clipboard
  const handleCopy = (section) => {
    if (!messages[section]) return;
    
    navigator.clipboard.writeText(messages[section])
      .then(() => {
        setCopiedSection(section);
        setTimeout(() => setCopiedSection(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy message. Please try again.');
      });
  };
  
  // Download message as PDF
  const handleDownload = (section) => {
    if (!messageRefs[section]?.current || !messages[section]) return;
    
    const recipient = getRecipientLabel(section);
    
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
    
    const parentNode = messageRefs[section].current.parentNode;
    if (parentNode) {
      parentNode.appendChild(loadingDiv);
    }
    
    // Create a styled container for the message
    const container = document.createElement('div');
    container.style.padding = '0.75in';
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#000000';
    container.style.fontFamily = "'Helvetica Neue', Arial, sans-serif";
    container.style.fontSize = '11pt';
    container.style.lineHeight = '1.4';
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = `LinkedIn Message for ${recipient}`;
    title.style.fontSize = '14pt';
    title.style.marginBottom = '20px';
    title.style.color = '#2c5777';
    container.appendChild(title);
    
    // Add content
    const content = document.createElement('div');
    content.style.whiteSpace = 'pre-wrap';
    content.textContent = messages[section];
    container.appendChild(content);
    
    // Add metadata
    const metadata = document.createElement('div');
    metadata.style.marginTop = '30px';
    metadata.style.fontSize = '9pt';
    metadata.style.color = '#666666';
    metadata.innerHTML = `
      <p>Character count: ${messages[section].length}</p>
      <p>Generated for: ${typeof jobDetails.role === 'string' ? jobDetails.role : (jobDetails.role?.title || jobDetails.title || 'Position')} at ${typeof jobDetails.company === 'string' ? jobDetails.company : (jobDetails.company?.name || jobDetails.companyName || 'Company')}</p>
      <p>Recipient type: ${recipient}</p>
    `;
    container.appendChild(metadata);
    
    // Configure html2pdf options
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `LinkedIn_Message_${recipient}_${personalInfo.lastName || 'User'}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait', compress: true }
    };
    
    // Generate the PDF
    setTimeout(() => {
      html2pdf()
        .set(opt)
        .from(container)
        .save()
        .then(() => {
          if (loadingDiv.parentNode) {
            loadingDiv.parentNode.removeChild(loadingDiv);
          }
        })
        .catch(err => {
          console.error('PDF generation error:', err);
          if (loadingDiv.parentNode) {
            loadingDiv.parentNode.removeChild(loadingDiv);
          }
        });
    }, 300);
  };

  // Handle choosing a different template for a message
  const selectTemplate = (section, templateIndex) => {
    const templates = generateTemplates();
    const templateMessage = templates[section][templateIndex].message;
    
    setMessages({
      ...messages,
      [section]: templateMessage
    });
    
    setSelectedTemplates({
      ...selectedTemplates,
      [section]: templateIndex
    });
    
    // Close the expanded section if user selected a template
    setExpandedSection(null);
  };

  // Toggle expansion of a section
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  // Render a template selection card
  const renderTemplateOption = (section, template, index) => {
    const isSelected = selectedTemplates[section] === index;
    
    return (
      <div 
        key={index}
        className={`p-3 border rounded cursor-pointer transition-all ${
          isSelected
            ? theme.isDarkMode 
              ? 'border-blue-400 bg-blue-900 bg-opacity-20 shadow-md' 
              : 'border-blue-500 bg-blue-50 shadow-md'
            : theme.isDarkMode
              ? 'bg-gray-700 hover:border-blue-400 hover:bg-gray-600'
              : 'bg-white hover:border-blue-400 hover:bg-gray-50'
        }`}
        onClick={() => selectTemplate(section, index)}
      >
        <div className="flex items-center justify-between">
          <h4 className={`font-medium ${theme.isDarkMode ? 'text-gray-200' : 'text-blue-600'}`}>
            {template.title}
          </h4>
          {isSelected && (
            <span className="text-xs px-2 py-1 rounded-full bg-blue-500 text-white">Selected</span>
          )}
        </div>
        <p className={`text-xs ${theme.isDarkMode ? 'text-gray-300' : 'text-gray-500'} mt-1 line-clamp-3`}>
          {template.message.substring(0, 100)}...
        </p>
      </div>
    );
  };
  
  // Render the message section
  const renderMessageSection = (section) => {
    return (
      <div 
        className={`mb-4 rounded-lg overflow-hidden transition-colors ${
          theme.isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        } ${
          expandedSection === section ? 'shadow-lg' : 'shadow'
        }`}
        key={section}
      >
        <div 
          className={`cursor-pointer transition-colors ${
            expandedSection === section 
              ? theme.isDarkMode ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-50'
              : theme.isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
          }`}
          onClick={() => toggleSection(section)}
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xl" role="img" aria-label={getRecipientLabel(section)}>
                  {getRecipientIcon(section)}
                </span>
                <h3 className={`font-medium ${theme.isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {getRecipientLabel(section)}
                </h3>
                
                {/* Add job role badge */}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  theme.isDarkMode ? 'bg-blue-800 text-blue-100' : 'bg-blue-100 text-blue-800'
                }`}>
                  {jobDetails.role || 'Job Role'}
                </span>
              </div>
              <div className="flex items-center">
                <span className={`text-xs mr-2 ${theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {expandedSection === section ? 'Collapse' : 'Expand'}
                </span>
                <span>
                  {expandedSection === section ? '↑' : '↓'}
                </span>
              </div>
            </div>
            
            {/* Preview of message, only showing in collapsed state */}
            {expandedSection !== section && (
              <p className={`mt-2 text-sm ${theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                {messages[section].split('\n')[0]}...
              </p>
            )}
          </div>
        </div>

        {/* Expanded content */}
        {expandedSection === section && (
          <div className="p-4 border-t transition-colors" 
              style={{ 
                borderColor: theme.isDarkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(229, 231, 235, 0.8)'
              }}>
            <div className="flex justify-between mb-3">
              <div>
                <span className={`text-xs ${theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  LinkedIn Message for: <span className="font-medium text-blue-500">{jobDetails.role || 'Job Role'}</span> at <span className="font-medium">{jobDetails.company || 'Company'}</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopy(section)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    theme.isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {copiedSection === section ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => handleDownload(section)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    theme.isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  PDF
                </button>
                <button
                  onClick={() => toggleEdit(section)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    editingSections[section]
                      ? theme.isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white'
                      : theme.isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {editingSections[section] ? 'Save' : 'Edit'}
                </button>
              </div>
            </div>

            {/* Message display or edit */}
            <div ref={messageRefs[section]}>
              {editingSections[section] ? (
                <textarea
                  value={customMessages[section] || ''}
                  onChange={(e) => updateCustomMessage(section, e.target.value)}
                  className={`w-full p-3 rounded border ${
                    theme.isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-700 border-gray-300'
                  }`}
                  style={{ minHeight: '200px' }}
                />
              ) : (
                <div
                  className={`p-3 rounded whitespace-pre-wrap ${
                    theme.isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'
                  }`}
                  style={{ minHeight: '200px' }}
                >
                  {messages[section]}
                </div>
              )}
            </div>

            {/* Tips section */}
            <div className="mt-4">
              <h4 className={`font-medium mb-2 ${theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Tips for messaging {getRecipientLabel(section)}s:
              </h4>
              <ul className={`list-disc ml-5 text-sm ${theme.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {getTipsForType(section).map((tip, index) => (
                  <li key={index} className="mb-1">{tip}</li>
                ))}
              </ul>
            </div>

            {/* Template selection */}
            <div className="mt-4">
              <h4 className={`font-medium mb-2 ${theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Alternative Templates:
              </h4>
              <div className="grid gap-3">
                {generateTemplates()[section].map((template, index) => 
                  renderTemplateOption(section, template, index)
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Add this job details summary component
  const renderJobDetailsSummary = () => {
    // Only render if we have job details
    if (!jobDetails || (!jobDetails.role && !jobDetails.company)) {
      return null;
    }

    const keySkills = jobDetails.keySkills 
      ? jobDetails.keySkills.split(',').map(s => s.trim()).filter(s => s) 
      : [];
    
    return (
      <div className={`mb-6 p-4 rounded-lg border ${
        theme.isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <h3 className={`font-semibold mb-2 ${
          theme.isDarkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>
          Job Details <span className="text-blue-500">for Your Messages</span>
        </h3>
        
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <p className={`text-sm ${theme.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="font-medium">Role:</span> {jobDetails.role || 'N/A'}
            </p>
            <p className={`text-sm ${theme.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="font-medium">Company:</span> {jobDetails.company || 'N/A'}
            </p>
            <p className={`text-sm ${theme.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="font-medium">Industry:</span> {jobDetails.industry || 'N/A'}
            </p>
          </div>
          
          <div>
            <p className={`text-sm mb-1 ${
              theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <span className="font-medium">Key Requirements:</span>
            </p>
            {jobDetails.keyRequirement && (
              <div className={`mb-1 inline-block mr-2 px-2 py-1 text-xs rounded-full ${
                theme.isDarkMode 
                  ? 'bg-blue-900 bg-opacity-40 text-blue-200' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {jobDetails.keyRequirement}
              </div>
            )}
            {keySkills.map((skill, index) => (
              <div 
                key={index}
                className={`mb-1 inline-block mr-2 px-2 py-1 text-xs rounded-full ${
                  theme.isDarkMode 
                    ? 'bg-gray-700 text-gray-300' 
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {skill}
              </div>
            ))}
          </div>
        </div>
        
        <p className={`mt-3 text-xs italic ${
          theme.isDarkMode ? 'text-gray-500' : 'text-gray-500'
        }`}>
          Tip: Reference these key skills directly in your messages to increase response rates
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className={`p-4 border-b ${theme.isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex justify-between items-center">
          <h2 className={`text-xl font-semibold ${theme.isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            LinkedIn Connection Messages
          </h2>
          
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${theme.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Auto-generated for: <strong>{typeof jobDetails.role === 'string' ? jobDetails.role : (jobDetails.role?.title || jobDetails.title || 'Position')}</strong> at <strong>{typeof jobDetails.company === 'string' ? jobDetails.company : (jobDetails.company?.name || jobDetails.companyName || 'Company')}</strong>
            </span>
          </div>
        </div>
        
        <p className={`mt-1 text-sm ${theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Personalized messages for different types of LinkedIn connections to help with your job search. Click each card to expand.
        </p>
      </div>

      {/* Job details summary */}
      {renderJobDetailsSummary()}
      
      {/* Message sections */}
      <div className="space-y-2">
        {renderMessageSection('recruiter')}
        {renderMessageSection('hiringManager')}
        {renderMessageSection('teamMember')}
        {renderMessageSection('alumni')}
        {renderMessageSection('industry')}
      </div>

      {isGenerating && (
        <div className={`p-4 rounded bg-opacity-30 ${
          theme.isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
        }`}>
          <p className="text-center">Generating personalized messages...</p>
        </div>
      )}
    </div>
  );
};

export default LinkedInMessageGenerator; 