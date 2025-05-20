import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { useTheme } from '../context/ThemeContext';

const TextDocumentEditor = ({ 
  content = '',
  type = 'coverLetter', // 'coverLetter', 'followUpEmail'
  personalInfo = {},
  jobDetails = {},
  onSave
}) => {
  const theme = useTheme();
  const [editedContent, setEditedContent] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const contentRef = useRef(null);
  
  // Update local state when props change
  useEffect(() => {
    setEditedContent(content);
    setHasChanges(false);
  }, [content]);
  
  // Update the content with personalInfo
  const updateContent = (text) => {
    setEditedContent(text);
    setHasChanges(true);
  };
  
  // Save changes
  const handleSave = () => {
    if (onSave) {
      onSave(editedContent);
    }
    setIsEditing(false);
    setHasChanges(false);
  };
  
  // Enter edit mode
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  // Download as PDF
  const handleDownloadPDF = () => {
    if (!contentRef.current) return;
    
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
    
    if (contentRef.current.parentNode) {
      contentRef.current.parentNode.appendChild(loadingDiv);
    }
    
    // Configure html2pdf options
    const opt = {
      margin: [0.75, 0.75, 0.75, 0.75],
      filename: `${type === 'coverLetter' ? 'Cover_Letter' : 'Follow_Up_Email'}_${personalInfo.lastName || 'Document'}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait',
        compress: true
      }
    };
    
    // Create a copy of the element with proper styling for PDF
    const element = contentRef.current.cloneNode(true);
    element.style.padding = '1in';
    element.style.backgroundColor = '#ffffff';
    element.style.color = '#000000';
    element.style.fontFamily = "'Helvetica Neue', Arial, sans-serif";
    element.style.fontSize = '11pt';
    element.style.lineHeight = '1.4';
    
    // Generate the PDF
    setTimeout(() => {
      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          // Remove loading indicator
          if (loadingDiv.parentNode) {
            loadingDiv.parentNode.removeChild(loadingDiv);
          }
        })
        .catch(err => {
          console.error('PDF generation error:', err);
          if (loadingDiv.parentNode) {
            loadingDiv.parentNode.removeChild(loadingDiv);
          }
          
          // Fallback to text download if PDF fails
          alert('PDF generation encountered an error. Falling back to text download.');
          handleDownloadText();
        });
    }, 500);
  };
  
  // Download as text
  const handleDownloadText = () => {
    if (!editedContent) return;
    
    const element = document.createElement('a');
    const file = new Blob([editedContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${type === 'coverLetter' ? 'Cover_Letter' : 'Follow_Up_Email'}_${personalInfo.lastName || 'Document'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  // Format display based on type
  const getTitle = () => {
    switch(type) {
      case 'coverLetter':
        return 'Cover Letter';
      case 'followUpEmail':
        return 'Follow-Up Email';
      default:
        return 'Document';
    }
  };
  
  // Render common field inserter to help add personalized fields
  const renderFieldInserter = () => {
    const commonFields = [
      { label: 'Your Name', value: `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() },
      { label: 'Your Email', value: personalInfo.email || '' },
      { label: 'Your Phone', value: personalInfo.phone || '' },
      { label: 'Company Name', value: jobDetails.company || '' },
      { label: 'Job Title', value: jobDetails.role || '' },
      { label: 'Current Date', value: new Date().toLocaleDateString() },
    ];
    
    return (
      <div className={`mt-4 p-3 border rounded ${theme.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <h4 className={`text-sm font-medium mb-2 ${theme.isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Insert Fields:
        </h4>
        <div className="flex flex-wrap gap-2">
          {commonFields.map((field, index) => (
            field.value ? (
              <button
                key={index}
                onClick={() => updateContent(editedContent + ' ' + field.value)}
                className={`text-xs px-2 py-1 rounded ${
                  theme.isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {field.label}
              </button>
            ) : null
          ))}
        </div>
      </div>
    );
  };
  
  // Suggestion templates for different document types
  const getSuggestionTemplates = () => {
    const templates = {
      coverLetter: [
        {
          title: 'Standard Cover Letter',
          content: `[Your Name]
[Your Address]
[City, State ZIP]
[Your Email]
[Your Phone]

[Date]

[Recipient's Name]
[Position]
${jobDetails.company ? jobDetails.company.toUpperCase() : '[COMPANY NAME]'}
[Company Address]
[City, State ZIP]

Dear [Recipient's Name],

I am writing to express my strong interest in the **${jobDetails.role || '[JOB TITLE]'}** position at **${jobDetails.company || '[COMPANY NAME]'}** as advertised on [where you found the job]. With my [X years] of experience in ${jobDetails.industry || '[Industry]'}, I am confident that my specific skills and achievements directly align with your requirements.

[FIRST PARAGRAPH: Highlight 2-3 specific skills/experiences from your resume that EXACTLY match key requirements in the job description. Example: "Your job description emphasizes the need for experience with data analytics tools and cross-functional collaboration. During my 5 years at ABC Corp, I led a team that implemented Tableau dashboards that increased decision-making efficiency by 35% while collaborating directly with marketing, sales, and executive stakeholders."]

[SECOND PARAGRAPH: Address 2-3 specific challenges or needs mentioned in the job description and how you've solved similar ones. Example: "I understand **${jobDetails.company || '[COMPANY NAME]'}** is expanding its digital transformation initiatives. In my current role at XYZ Inc., I successfully migrated legacy systems to cloud platforms, resulting in a 28% cost reduction and 40% improvement in processing speeds—exactly the kind of results I'm excited to deliver for your team."]

ADDITIONAL VALUE I BRING TO **${jobDetails.company || '[COMPANY NAME]'}**:
• [Specific technical skill] with [measurable achievement]
• [Relevant certification/training] that enhances my ability to [job function]
• [Soft skill relevant to role] demonstrated by [specific example]

Thank you for considering my application. I am particularly drawn to **${jobDetails.company || '[COMPANY NAME]'}**'s ${jobDetails.companyStrength || 'innovative approach'} in the ${jobDetails.industry || 'industry'}, and I'm excited about the opportunity to contribute to your ${jobDetails.teamGoal || 'team goals'}. I welcome the opportunity to discuss how my expertise with [match 2-3 keywords from job description] would make immediate contributions to your team.

Sincerely,
[Your Name]
`
        },
        {
          title: 'Accomplishment-Focused Cover Letter',
          content: `[Your Name]
[Your Email] | [Your Phone] | [Your LinkedIn/Portfolio URL]

[Date]

RE: Application for **${jobDetails.role || '[JOB TITLE]'}** position at **${jobDetails.company || '[COMPANY NAME]'}**

Dear ${jobDetails.hiringManager || 'Hiring Manager'},

After researching **${jobDetails.company || '[COMPANY NAME]'}**'s recent ${jobDetails.companyAchievement || 'achievements'} and growth in the ${jobDetails.industry || 'industry'}, I am excited to apply for the **${jobDetails.role || '[JOB TITLE]'}** position. My background provides a perfect match for your stated requirements, as demonstrated by these specific accomplishments:

KEY QUALIFICATIONS MATCHING YOUR REQUIREMENTS:

• **${jobDetails.requirement1 || '[Requirement from job description]'}**: 
  [Specific achievement with measurable result that directly addresses this requirement. Include metrics whenever possible.]

• **${jobDetails.requirement2 || '[Requirement from job description]'}**: 
  [Specific achievement with measurable result that directly addresses this requirement. Use action verbs and quantifiable results.]

• **${jobDetails.requirement3 || '[Requirement from job description]'}**: 
  [Specific achievement with measurable result that directly addresses this requirement. Show both skills and impact.]

What excites me most about joining **${jobDetails.company || '[COMPANY NAME]'}** is the opportunity to contribute to [reference specific project, challenge, or responsibility mentioned in job description]. At [Previous Company], I delivered [specific relevant outcome] by [action you took], which directly relates to your team's current objectives.

WHY **${jobDetails.company || '[COMPANY NAME]'}** SPECIFICALLY:
I'm particularly drawn to **${jobDetails.company || '[COMPANY NAME]'}**'s commitment to [company value or initiative from research] and your reputation for [positive aspect of company culture]. My professional values align perfectly with your company's focus on [company priority from research], making this opportunity particularly compelling.

I would welcome the opportunity to discuss how my specific expertise with [exact technologies/skills from job description] would contribute directly to your team's success. I'm available for an interview at your convenience and can be reached at [phone] or [email].

Thank you for your consideration,
[Your Name]
`
        },
        {
          title: 'Career Transition Cover Letter',
          content: `[Your Name]
[Your Email] | [Your Phone] | [Your LinkedIn/Portfolio URL]

[Date]

SUBJECT: Application for **${jobDetails.role || '[JOB TITLE]'}** at **${jobDetails.company || '[COMPANY NAME]'}**

Dear Hiring Team at **${jobDetails.company || '[COMPANY NAME]'}**,

I'm excited to apply for the **${jobDetails.role || '[JOB TITLE]'}** position at **${jobDetails.company || '[COMPANY NAME]'}**. While my background includes experience in [previous industry/role], I have developed highly transferable skills and achievements that align perfectly with your requirements:

DIRECTLY RELEVANT SKILLS & ACCOMPLISHMENTS:

• **${jobDetails.skill1 || '[Key skill from job description]'}**: Through my experience in [relevant project/role], I've demonstrated expertise in this area by [specific example with results that directly connects to the new role].

• **${jobDetails.skill2 || '[Key skill from job description]'}**: At [current/previous company], I [specific achievement] resulting in [measurable outcome], showcasing my ability to excel in this crucial aspect of the role.

• **Project Management & Execution**: Successfully led [specific project] with [budget/team size] that [measurable result], demonstrating my ability to drive initiatives and deliver results in new contexts.

My interest in **${jobDetails.company || '[COMPANY NAME]'}** stems from [specific research about company mission/values/products] and how they align with my professional goals. I've prepared for this transition by [relevant training/education/certification/self-study] to ensure I can make an immediate impact on your team.

THE VALUE I BRING TO **${jobDetails.company || '[COMPANY NAME]'}**:
• Fresh perspective combined with proven ability to adapt quickly
• Strong analytical background that transfers directly to your industry's challenges
• Exceptional communication skills developed across diverse business contexts

I'm particularly impressed by **${jobDetails.company || '[COMPANY NAME]'}**'s recent [company achievement or initiative] and am excited about contributing to your future success. I welcome the opportunity to discuss how my background, though nontraditional, makes me uniquely qualified to excel in this role.

Thank you for your consideration,
[Your Name]
`
        }
      ],
      followUpEmail: [
        {
          title: 'Post-Interview Thank You',
          content: `Subject: Thank You for Discussing the **${jobDetails.role || '[Position]'}** Role - [Your Name]

Dear [Interviewer's Name],

Thank you for taking the time to discuss the **${jobDetails.role || '[Position]'}** role at **${jobDetails.company || '[COMPANY NAME]'}** today. Our conversation about [specific project or challenge mentioned during interview] reinforced my enthusiasm for the position and confirmed that my experience directly aligns with your needs.

SPECIFIC ALIGNMENT POINTS:

1. You mentioned the team needs someone who can **[specific skill/requirement discussed]**: During my time at [Previous Company], I [specific example of how you've successfully used this skill with measurable results].

2. We discussed the challenge of **[challenge mentioned in interview]**: I've reflected on this and would approach it by [brief specific strategy based on your relevant experience], similar to how I successfully [related past achievement].

3. The **[specific technology/methodology]** you're implementing aligns perfectly with my experience in [directly related skill from your background], where I [specific achievement using this skill/technology].

I'm particularly excited about the opportunity to contribute to **${jobDetails.company || '[COMPANY NAME]'}**'s [specific team goal or company initiative discussed]. My background in [relevant experience that EXACTLY matches their needs] provides me with the precise perspective needed to make an immediate impact.

ADDITIONAL THOUGHTS:
After our conversation, I had an additional idea about [challenge or project discussed] that I'd be happy to share in our next discussion. I believe my experience with [relevant skill] offers a unique approach that could be valuable to your team.

Please don't hesitate to contact me if you need any additional information about how my experience with [key requirement] directly addresses your team's current needs.

Best regards,
[Your Name]
[Your Phone]
[Your Email]
`
        },
        {
          title: 'Strategic Application Follow-Up',
          content: `Subject: Following Up on **${jobDetails.role || '[Position]'}** Application - [Your Name]

Dear [Recipient's Name],

I recently applied for the **${jobDetails.role || '[Position]'}** role at **${jobDetails.company || '[COMPANY NAME]'}** on [date], and I wanted to reinforce my interest in this specific opportunity.

After further researching **${jobDetails.company || '[COMPANY NAME]'}**'s [recent initiative, product launch, or challenge], I'm even more confident that my background makes me an ideal candidate for this role:

KEY ALIGNMENT POINTS:

• Your job posting emphasizes **[specific requirement from job description]**: I offer [X years/specific experience] in this exact area, having [specific achievement with measurable results directly related to this requirement].

• I noted **${jobDetails.company || '[COMPANY NAME]'}** is [current company priority based on research]: My experience with [directly relevant skill/project] at [Previous Company] directly addresses this need, as I [specific relevant accomplishment].

• The technical requirements for **[specific technical skill in job description]**: In my current role, I [specific example of using this exact technology/skill], resulting in [measurable positive outcome].

VALUE PROPOSITION FOR **${jobDetails.company || '[COMPANY NAME]'}**:
I understand the challenges of [industry-specific challenge] and have consistently delivered [type of results] through my expertise in [key skills matching job requirements]. My approach combines technical proficiency with strategic thinking, which I believe would be valuable to your team.

I understand you're likely reviewing many applications, but I'm confident that my specific experience with [key technology/skill/approach mentioned in job description] would bring immediate value to your team. I've attached my tailored resume highlighting the exact qualifications that match your requirements.

I would welcome a conversation to discuss how my specific accomplishments in [key area from job description] align with **${jobDetails.company || '[COMPANY NAME]'}**'s current objectives.

Thank you for your consideration,
[Your Name]
[Your Phone]
[Your Email]
`
        }
      ]
    };
    
    return templates[type] || [];
  };
  
  return (
    <div className={`w-full border rounded-lg overflow-hidden flex flex-col ${theme.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className={`p-4 border-b flex justify-between items-center ${theme.isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <h2 className={`text-xl font-semibold ${theme.isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>{getTitle()}</h2>
        <div className="flex space-x-2">
          {!isEditing && (
            <>
              <button
                onClick={handleEdit}
                className={`px-3 py-1 text-sm rounded border ${
                  theme.isDarkMode 
                    ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-200' 
                    : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
                }`}
              >
                Edit
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600"
              >
                Download PDF
              </button>
            </>
          )}
          {isEditing && (
            <button
              onClick={handleSave}
              className={`px-3 py-1 text-sm rounded ${hasChanges ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-400 text-white cursor-not-allowed'}`}
              disabled={!hasChanges}
            >
              Save Changes
            </button>
          )}
        </div>
      </div>
      
      <div className="p-4 flex-grow">
        {isEditing ? (
          <div>
            {/* Suggestions */}
            {(!content || content.trim() === '') && (
              <div className={`mb-4 p-3 border rounded ${theme.isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`text-sm font-medium mb-2 ${theme.isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Start with a template:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {getSuggestionTemplates().map((template, index) => (
                    <button
                      key={index}
                      onClick={() => updateContent(template.content)}
                      className={`text-left p-2 rounded border ${
                        theme.isDarkMode 
                          ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' 
                          : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <strong className={theme.isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{template.title}</strong>
                      <p className="text-xs truncate">{template.content.split('\n')[0]}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Editor */}
            <textarea
              value={editedContent}
              onChange={(e) => updateContent(e.target.value)}
              className={`w-full h-80 p-4 border rounded resize-none mb-4 font-mono text-sm ${
                theme.isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-100' 
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
              placeholder={`Start writing your ${getTitle().toLowerCase()} here...`}
            ></textarea>
            
            {/* Field inserter tool */}
            {renderFieldInserter()}
          </div>
        ) : (
          <div 
            ref={contentRef}
            className={`w-full h-full min-h-[400px] p-4 whitespace-pre-wrap font-mono text-sm ${
              theme.isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}
          >
            {editedContent || (
              <p className={`text-center py-8 ${theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No content yet. Click "Edit" to start writing your {getTitle().toLowerCase()}.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TextDocumentEditor; 