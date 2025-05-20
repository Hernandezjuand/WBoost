import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import DocumentPreview from './DocumentPreview';
import CVGenerator from './CVGenerator';
import TextDocumentEditor from './TextDocumentEditor';
import LinkedInMessageGenerator from './LinkedInMessageGenerator';

// Helper functions for extracting data from resume
const extractSkills = (resume) => {
  if (!resume || !resume.skills) return ['relevant skills'];
  
  const allSkills = [];
  for (const category in resume.skills) {
    const skills = resume.skills[category];
    if (typeof skills === 'string') {
      allSkills.push(...skills.split(',').map(s => s.trim()));
    } else if (Array.isArray(skills)) {
      allSkills.push(...skills);
    }
  }
  
  return allSkills.slice(0, 3);
};

const extractExperience = (resume) => {
  if (!resume || !resume.experience || !resume.experience[0]) {
    return 'the relevant field';
  }
  return resume.experience[0].title || 'the relevant field';
};

const extractAchievements = (resume) => {
  if (!resume || !resume.experience || !resume.experience[0] || !resume.experience[0].achievements) {
    return 'notable results in previous roles';
  }
  
  const achievement = resume.experience[0].achievements[0];
  return achievement || 'notable results in previous roles';
};

const extractProjects = (resume) => {
  // Look for projects in other sections
  if (resume && resume.otherSections) {
    const projectSection = resume.otherSections.find(section => 
      section.title.toLowerCase().includes('project'));
      
    if (projectSection && projectSection.entries && projectSection.entries[0]) {
      return projectSection.entries[0].header?.title || 'relevant projects';
    }
  }
  
  return 'relevant projects';
};

const LINKEDIN_TEMPLATES = {
  sameCareer: (resume, jobDetails) => {
    const role = jobDetails?.role || 'the position';
    const company = jobDetails?.company || 'your company';
    const skills = extractSkills(resume);
    const experience = extractExperience(resume);
    const achievements = extractAchievements(resume);
    
    return `
Hi [Name],

I noticed we both work in ${role}. With my experience in ${experience} and expertise in ${skills.join(', ')}, I'm particularly interested in the opportunities at ${company}.

I've achieved ${achievements}, and I believe these accomplishments align well with ${company}'s goals. I'd love to connect and learn more about your experience at ${company}, especially regarding [specific aspect of the role that interests you].

Best regards,
[Your Name]`;
  },
  
  industryExpert: (resume, jobDetails) => {
    const role = jobDetails?.role || 'the position';
    const company = jobDetails?.company || 'your company';
    const skills = extractSkills(resume);
    const projects = extractProjects(resume);
    const achievements = extractAchievements(resume);
    
    return `
Hi [Name],

I've been following ${company}'s work in the ${role} space and was particularly impressed by your recent projects. With my experience in ${projects} and expertise in ${skills.join(', ')}, I believe I could bring valuable insights to your team.

I've achieved ${achievements}, which demonstrates my ability to deliver results in this field. I'd love to connect and learn more about your team's approach to [specific aspect of the role].

Best regards,
[Your Name]`;
  },
  
  referralRequest: (resume, jobDetails) => {
    const role = jobDetails?.role || 'the position';
    const company = jobDetails?.company || 'your company';
    const skills = extractSkills(resume);
    const experience = extractExperience(resume);
    const achievements = extractAchievements(resume);
    
    return `
Hi [Name],

I'm reaching out because I'm very interested in the ${role} position at ${company}. With my background in ${experience} and expertise in ${skills.join(', ')}, I believe I would be a great fit for the role.

I've achieved ${achievements}, which I believe would be valuable to ${company}. Would you be open to referring me for this position? I'd be happy to provide more details about my experience and qualifications.

Best regards,
[Your Name]`;
  },
  
  informationalInterview: (resume, jobDetails) => {
    const role = jobDetails?.role || 'the position';
    const company = jobDetails?.company || 'your company';
    const experience = extractExperience(resume);
    const skills = extractSkills(resume);
    
    return `
Hi [Name],

I'm a ${role} professional with experience in ${experience} and expertise in ${skills.join(', ')}. I'm very interested in learning more about ${company}'s approach to [specific aspect of the role].

Would you be open to a brief informational interview about your experience at ${company}? I'd love to learn more about your career path and insights into the industry.

Best regards,
[Your Name]`;
  },
  
  projectBased: (resume, jobDetails) => {
    const role = jobDetails?.role || 'the position';
    const company = jobDetails?.company || 'your company';
    const projects = extractProjects(resume);
    const skills = extractSkills(resume);
    
    return `
Hi [Name],

I came across ${company}'s work in the ${role} space and was particularly impressed by your approach to [specific project or initiative]. With my experience in ${projects} and expertise in ${skills.join(', ')}, I believe I could contribute meaningfully to your team.

I'd love to connect and learn more about how your team approaches [specific aspect of the role or project].

Best regards,
[Your Name]`;
  }
};

const GeneratedDocuments = ({ documents = {}, onSaveChanges }) => {
  const theme = useTheme();
  const [activeDocumentType, setActiveDocumentType] = useState('resume');
  const [activeProvider, setActiveProvider] = useState('openai');
  const [activeLinkedInTemplate, setActiveLinkedInTemplate] = useState('sameCareer');
  
  // Set first available provider when documents change
  useEffect(() => {
    if (documents && documents[activeDocumentType]) {
      const providers = Object.keys(documents[activeDocumentType]);
      if (providers.length > 0 && !providers.includes(activeProvider)) {
        setActiveProvider(providers[0]);
      }
    }
  }, [documents, activeDocumentType]);
  
  // Find all available providers
  const getAvailableProviders = () => {
    if (!documents || !documents[activeDocumentType]) {
      return [];
    }
    
    return Object.keys(documents[activeDocumentType]);
  };
  
  // Handle save changes callback
  const handleSaveDocument = (updatedContent) => {
    if (onSaveChanges) {
      // For CVGenerator, the entire resume object is passed
      if (activeDocumentType === 'resume') {
        onSaveChanges(activeDocumentType, activeProvider, updatedContent);
      } 
      // For text documents, wrap the content in the expected format
      else if (activeDocumentType === 'coverLetter' || activeDocumentType === 'followUpEmail') {
        onSaveChanges(activeDocumentType, activeProvider, { content: updatedContent });
      }
    }
  };
  
  // Get the current document's content
  const getCurrentDocument = () => {
    if (!documents || !documents[activeDocumentType] || !documents[activeDocumentType][activeProvider]) {
      return null;
    }
    
    return documents[activeDocumentType][activeProvider];
  };
  
  // Render the active document based on type
  const renderActiveDocument = () => {
    const currentDoc = getCurrentDocument();
    
    if (!currentDoc) {
      return (
        <div className="text-center p-8 rounded-lg bg-gray-50 border">
          <p className="text-gray-600">No document available for this type/provider</p>
        </div>
      );
    }
    
    switch (activeDocumentType) {
      case 'resume':
        return (
          <CVGenerator 
            personalInfo={currentDoc.personalInfo} 
            education={currentDoc.education} 
            skills={currentDoc.skills} 
            experience={currentDoc.experience}
            otherSections={currentDoc.otherSections || []}
            onSave={handleSaveDocument}
          />
        );
        
      case 'coverLetter':
        return (
          <TextDocumentEditor
            type="coverLetter"
            content={currentDoc.content}
            personalInfo={documents.resume?.[activeProvider]?.personalInfo || {}}
            jobDetails={documents.jobDetails || {}}
            onSave={handleSaveDocument}
          />
        );
        
      case 'followUpEmail':
        return (
          <TextDocumentEditor
            type="followUpEmail"
            content={currentDoc.content}
            personalInfo={documents.resume?.[activeProvider]?.personalInfo || {}}
            jobDetails={documents.jobDetails || {}}
            onSave={handleSaveDocument}
          />
        );
        
      case 'linkedinMessages':
        return (
          <LinkedInMessageGenerator
            personalInfo={documents.resume?.[activeProvider]?.personalInfo || {}}
            resume={documents.resume?.[activeProvider] || {}}
            jobDetails={documents.jobDetails || {}}
          />
        );
        
      default:
        return (
          <DocumentPreview 
            content={typeof currentDoc === 'string' ? currentDoc : currentDoc.content} 
            type={activeDocumentType}
            provider={activeProvider}
          />
        );
    }
  };
  
  // Render LinkedIn Messages section
  const renderLinkedInMessages = () => {
    const resume = documents?.resume?.[activeProvider] || {};
    const jobDetails = documents?.jobDetails || {};

    return (
      <div className="space-y-6">
        {/* Template Selection */}
        <div className="flex flex-wrap gap-3 mb-6">
          {Object.keys(LINKEDIN_TEMPLATES).map((templateKey) => (
            <button
              key={templateKey}
              onClick={() => setActiveLinkedInTemplate(templateKey)}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeLinkedInTemplate === templateKey ? 'font-medium' : ''
              }`}
              style={{
                backgroundColor: activeLinkedInTemplate === templateKey 
                  ? theme.colors.accent 
                  : theme.colors.muted,
                color: activeLinkedInTemplate === templateKey 
                  ? theme.colors.white 
                  : theme.colors.text.secondary,
                border: `1px solid ${
                  activeLinkedInTemplate === templateKey 
                    ? theme.colors.accent 
                    : theme.isDarkMode 
                      ? 'rgba(75, 85, 99, 0.3)' 
                      : 'rgba(229, 231, 235, 0.8)'
                }`
              }}
            >
              {templateKey === 'sameCareer' ? 'Same Career Path' :
               templateKey === 'industryExpert' ? 'Industry Expert' :
               templateKey === 'referralRequest' ? 'Referral Request' :
               templateKey === 'informationalInterview' ? 'Informational Interview' :
               'Project Based'}
            </button>
          ))}
        </div>

        {/* Message Preview */}
        <div 
          className="p-6 rounded-lg border"
          style={{ 
            backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.7)',
            borderColor: theme.isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.5)'
          }}
        >
          <div className="prose max-w-none" style={{ color: theme.colors.text.primary }}>
            <pre className="whitespace-pre-wrap font-sans">
              {LINKEDIN_TEMPLATES[activeLinkedInTemplate](resume, jobDetails)}
            </pre>
          </div>
        </div>

        {/* Copy Button */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              navigator.clipboard.writeText(LINKEDIN_TEMPLATES[activeLinkedInTemplate](resume, jobDetails));
              // You could add a toast notification here
            }}
            className="px-4 py-2 rounded-lg transition-all flex items-center gap-2"
            style={{
              backgroundColor: theme.colors.button.primary,
              color: 'white'
            }}
          >
            <span>📋</span>
            Copy Message
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="rounded-lg shadow-lg p-6"
      style={{ backgroundColor: theme.colors.background, color: theme.colors.text.primary }}
    >
      <h2 className="text-xl font-semibold mb-6" style={{ color: theme.colors.text.primary }}>
        Generated Documents
      </h2>
      
      {/* Document Type Tabs */}
      <div className="flex gap-2 mb-4 border-b" style={{ borderColor: theme.colors.border }}>
        {['resume', 'coverLetter', 'followUpEmail', 'linkedinMessages'].map((type) => (
          <button
            key={type}
            onClick={() => setActiveDocumentType(type)}
            className={`px-3 py-2 font-medium transition-colors border-b-2 focus:outline-none ${
              activeDocumentType === type ? '' : 'border-transparent'
            }`}
            style={{
              borderColor: activeDocumentType === type ? theme.colors.accent : 'transparent',
              color: activeDocumentType === type ? theme.colors.accent : theme.colors.text.secondary,
              background: 'none',
            }}
          >
            {type === 'resume' ? 'Resume' : 
             type === 'coverLetter' ? 'Cover Letter' : 
             type === 'followUpEmail' ? 'Follow Up Email' : 
             'LinkedIn Messages'}
          </button>
        ))}
      </div>
      
      {/* Provider Buttons */}
      {activeDocumentType !== 'linkedinMessages' && (
        <div className="flex mb-6 gap-3">
          {getAvailableProviders().map((provider) => (
            <button
              key={provider}
              onClick={() => setActiveProvider(provider)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                activeProvider === provider ? 'font-medium' : ''
              }`}
              style={{
                backgroundColor: activeProvider === provider ? theme.colors.accent : theme.colors.muted,
                color: activeProvider === provider ? theme.colors.white : theme.colors.text.secondary,
              }}
            >
              {provider === 'openai' ? 'OpenAI' : 
               provider === 'deepseek' ? 'DeepSeek' : 
               provider === 'gemini' ? 'Gemini' : 
               provider.charAt(0).toUpperCase() + provider.slice(1)}
            </button>
          ))}
        </div>
      )}
      
      {/* Document Content */}
      <div className="mb-4">
        {activeDocumentType === 'linkedinMessages' ? (
          renderLinkedInMessages()
        ) : (
          renderActiveDocument()
        )}
      </div>
    </div>
  );
};

export default GeneratedDocuments; 