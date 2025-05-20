import axios from 'axios';

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const makeRequest = async (messages, apiKey) => {
  try {
    console.log('Making OpenAI request with messages:', messages);
    const response = await axios.post(
      OPENAI_URL,
      {
        model: "gpt-4",
        messages,
        stream: false
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        }
      }
    );
    console.log('OpenAI response:', response.data);
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(`OpenAI API Error: ${error.response?.data?.error?.message || error.message}`);
  }
};

export const extractJobDetails = async (jobDescription, apiKey) => {
  const messages = [
    {
      role: "system",
      content: "You are an AI assistant specialized in analyzing job descriptions. Extract key details from the job description and return a JSON object with company, role, location, salary, keySkills, keyRequirement, requirements, and any other important information. If specific information is not found, return empty strings for those fields."
    },
    {
      role: "user",
      content: `Job Description: ${jobDescription}`
    }
  ];

  const result = await makeRequest(messages, apiKey);
  return JSON.parse(result);
};

export const analyzeResumeFit = async (resume, jobDescription, apiKey) => {
  // Handle different job description formats
  let processedJobDescription = jobDescription;
  
  // If it's an object with a description property, use that
  if (typeof jobDescription === 'object' && jobDescription !== null) {
    if (jobDescription.description) {
      processedJobDescription = jobDescription.description;
    } else {
      // Try to convert the object to a string
      try {
        processedJobDescription = JSON.stringify(jobDescription);
      } catch (e) {
        console.warn('Warning: Could not stringify job description object', e);
      }
    }
  }
  
  // Ensure we have a non-empty string
  if (!processedJobDescription || typeof processedJobDescription !== 'string' || processedJobDescription.trim() === '') {
    console.error('Error: Empty or invalid job description', {
      type: typeof processedJobDescription,
      isEmpty: !processedJobDescription,
      length: processedJobDescription ? processedJobDescription.length : 0
    });
    processedJobDescription = "No job description provided";
  }
  
  // Log what we're sending
  console.log('OpenAI Processed job description', {
    length: processedJobDescription.length,
    preview: processedJobDescription.substring(0, 100) + '...',
    resume_length: typeof resume === 'string' ? resume.length : 'not a string'
  });

  const messages = [
    {
      role: "system",
      content: `You are a strict, professional resume analyst with expertise in hiring practices. Analyze the match between a job description and resume with COMPLETE HONESTY and BALANCED APPROACH. You must give EQUAL WEIGHT (50/50) to both the candidate's qualifications AND the job requirements.

Key analysis principles:
1. JOB REQUIREMENTS deserve 50% of your analysis focus - analyze in detail what the position actually requires
   - Extract SPECIFIC technical skills from the job description
   - Identify PRECISE experience level required (years, seniority)
   - Highlight EXACT technologies, tools, and methodologies mentioned 
   - Note CRITICAL industry-specific knowledge required
2. CANDIDATE QUALIFICATIONS deserve the other 50% - evaluate how well the candidate meets those specific requirements 
   - Assess how DIRECTLY the candidate's skills match each requirement
   - Compare experience level to what's required
   - Evaluate technical proficiency in required tools/technologies
3. Don't inflate scores - if a candidate is under-qualified, say so directly
4. Don't hesitate to point out if experience is too basic/simple for the position
5. Be honest about missing critical requirements

Return a complete and detailed JSON analysis with the following structure:
{
  "jobAnalysis": {
    "coreResponsibilities": string[],
    "requiredSkills": string[],
    "requiredExperience": string,
    "industryKnowledge": string
  },
  "candidateAssessment": {
    "overallFit": number,
    "skillsMatch": number,
    "experienceRelevance": number,
    "educationAlignment": number,
    "roleAppropriateLevel": number
  },
  "gapAnalysis": {
    "missingRequirements": string[],
    "criticalGaps": string[],
    "strengths": string[],
    "weaknesses": string[]
  },
  "recommendations": string[],
  "feedback": {
    "overall": string,
    "roleAlignment": string,
    "skills": string,
    "experience": string,
    "education": string,
    "honestAssessment": string
  }
}`
    },
    {
      role: "user",
      content: `Resume: ${resume}\n\nJob Description: ${processedJobDescription}`
    }
  ];

  try {
    const result = await makeRequest(messages, apiKey);
    console.log('OpenAI analysis response:', result);
    const parsed = JSON.parse(result);
    
    console.log('OpenAI parsed response structure:', {
      hasOverallFit: !!parsed.overallFit,
      hasCandidateAssessment: !!parsed.candidateAssessment,
      candidateAssessmentType: typeof parsed.candidateAssessment,
      hasJobAnalysis: !!parsed.jobAnalysis,
      hasFeedback: !!parsed.feedback,
      topLevelKeys: Object.keys(parsed)
    });
    
    // Super permissive validation - accept almost any structure and normalize it
    console.log('Normalizing OpenAI data');
    
    // Create a normalized structure with default values for everything
    const normalizedResult = {
      overallFit: 0,
      skillsMatch: 0,
      experienceRelevance: 0,
      educationAlignment: 0,
      roleAppropriateLevel: 0,
      missingRequirements: [],
      criticalGaps: [],
      strengths: [],
      weaknesses: [],
      recommendations: [],
      jobAnalysis: {
        coreResponsibilities: [],
        requiredSkills: [],
        requiredExperience: "",
        industryKnowledge: ""
      },
      feedback: {
        overall: "",
        roleAlignment: "",
        skills: "",
        experience: "",
        education: "",
        honestAssessment: ""
      }
    };
    
    // Try to extract values from multiple possible structures
    try {
      // Get overall scores from different possible locations
      normalizedResult.overallFit = parsed.overallFit || 
                                  parsed.candidateAssessment?.overallFit || 
                                  parsed.overall || 
                                  parsed.score || 
                                  parsed.match || 
                                  0;
                                  
      normalizedResult.skillsMatch = parsed.skillsMatch || 
                                   parsed.candidateAssessment?.skillsMatch || 
                                   parsed.skills_match || 
                                   parsed.skillScore || 
                                   parsed.skill_score || 
                                   0;
                                   
      normalizedResult.experienceRelevance = parsed.experienceRelevance || 
                                          parsed.candidateAssessment?.experienceRelevance || 
                                          parsed.experience_relevance || 
                                          parsed.experienceScore || 
                                          parsed.experience_score || 
                                          0;
                                          
      normalizedResult.educationAlignment = parsed.educationAlignment || 
                                         parsed.candidateAssessment?.educationAlignment || 
                                         parsed.education_alignment || 
                                         parsed.educationScore || 
                                         parsed.education_score || 
                                         0;
                                         
      normalizedResult.roleAppropriateLevel = parsed.roleAppropriateLevel || 
                                           parsed.candidateAssessment?.roleAppropriateLevel || 
                                           parsed.role_appropriate_level || 
                                           parsed.levelScore || 
                                           parsed.level_score || 
                                           0;
      
      // Extract arrays from different possible locations
      normalizedResult.missingRequirements = parsed.missingRequirements || 
                                          parsed.gapAnalysis?.missingRequirements || 
                                          parsed.missing_requirements || 
                                          parsed.missingKeywords || 
                                          parsed.missingSkills || 
                                          [];
                                     
      normalizedResult.criticalGaps = parsed.criticalGaps || 
                                    parsed.gapAnalysis?.criticalGaps || 
                                    parsed.critical_gaps || 
                                    [];
                                    
      normalizedResult.strengths = parsed.strengths || 
                                 parsed.gapAnalysis?.strengths || 
                                 [];
                                 
      normalizedResult.weaknesses = parsed.weaknesses || 
                                  parsed.gapAnalysis?.weaknesses || 
                                  [];
                                  
      normalizedResult.recommendations = parsed.recommendations || 
                                       parsed.suggestions || 
                                       [];
      
      // Extract job analysis
      if (parsed.jobAnalysis) {
        normalizedResult.jobAnalysis = {
          ...normalizedResult.jobAnalysis,
          ...parsed.jobAnalysis
        };
      }
      
      // Extract feedback
      if (parsed.feedback) {
        normalizedResult.feedback = {
          ...normalizedResult.feedback,
          ...parsed.feedback
        };
      } else if (parsed.analysis) {
        // If there's no structured feedback but there is an analysis string, use that
        normalizedResult.feedback.overall = parsed.analysis;
      }
      
      // Make sure numeric values are actually numbers
      normalizedResult.overallFit = Number(normalizedResult.overallFit) || 0;
      normalizedResult.skillsMatch = Number(normalizedResult.skillsMatch) || 0;
      normalizedResult.experienceRelevance = Number(normalizedResult.experienceRelevance) || 0;
      normalizedResult.educationAlignment = Number(normalizedResult.educationAlignment) || 0;
      normalizedResult.roleAppropriateLevel = Number(normalizedResult.roleAppropriateLevel) || 0;
      
      // Clamp values to be within 0-100
      normalizedResult.overallFit = Math.min(100, Math.max(0, normalizedResult.overallFit));
      normalizedResult.skillsMatch = Math.min(100, Math.max(0, normalizedResult.skillsMatch));
      normalizedResult.experienceRelevance = Math.min(100, Math.max(0, normalizedResult.experienceRelevance));
      normalizedResult.educationAlignment = Math.min(100, Math.max(0, normalizedResult.educationAlignment));
      normalizedResult.roleAppropriateLevel = Math.min(100, Math.max(0, normalizedResult.roleAppropriateLevel));
      
      // If we don't have any feedback, create some generic feedback
      if (!normalizedResult.feedback.overall) {
        normalizedResult.feedback.overall = `Overall match score: ${normalizedResult.overallFit}%`;
      }
      
      console.log('OpenAI data normalized successfully');
      
    } catch (normalizationError) {
      console.error('Error during OpenAI normalization:', normalizationError);
      // Continue with whatever we were able to normalize
    }
    
    return normalizedResult;
  } catch (error) {
    console.error('OpenAI Analysis error:', error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
};

export const generateResume = async (resume, jobDescription, analysis, apiKey) => {
  // Check if this is a sales role
  const isSalesRole = jobDescription.toLowerCase().includes('sales') || 
                     jobDescription.toLowerCase().includes('account manager') || 
                     jobDescription.toLowerCase().includes('business development') ||
                     jobDescription.toLowerCase().includes('customer acquisition');

  const messages = [
    {
      role: "system",
      content: `You are an expert resume optimizer specializing in ATS (Applicant Tracking System) optimization.

Your primary goal is to create a resume that will achieve a 95%+ match rate with the provided job description, while being completely truthful and maintaining the candidate's actual experience and skills.

SPECIFIC OPTIMIZATION INSTRUCTIONS:
1. KEYWORD MATCHING: Identify and incorporate exact keywords from the job description. Mirror the terminology and phrasing used in the job posting.
2. SKILL PRIORITIZATION: Highlight skills that directly match the job requirements by placing them prominently.
3. QUANTIFIABLE ACHIEVEMENTS: Transform generic statements into specific, measurable results where possible (e.g., "Increased sales by 20%" instead of "Improved sales").
4. BREVITY: Keep all bullet points under 12 words each. Use strong action verbs and eliminate unnecessary words.
5. LENGTH: Ensure the resume will fit on a SINGLE PAGE. Be ruthless about prioritizing only the most relevant experience.
6. SOFT SKILLS: Include relevant soft skills like teamwork, communication, and leadership where the job requires them.
7. JOB TITLE ALIGNMENT: If the candidate's actual experience could reasonably fit the job title terminology used in the posting, use matching terminology.
${isSalesRole ? `
SALES-SPECIFIC OPTIMIZATION:
1. SALES METRICS: Emphasize quantifiable sales metrics (revenue generated, quotas exceeded, conversion rates) where available.
2. CLIENT ACQUISITION: Highlight client/customer acquisition and relationship management experience.
3. SALES TERMINOLOGY: Use industry-specific sales terminology from the job description (e.g., lead generation, pipeline management, closing deals).
4. SALES SKILLS: Prioritize hard sales skills (CRM systems, negotiation) and soft skills (persuasion, relationship-building) relevant to the role.
5. INDUSTRY KNOWLEDGE: Emphasize knowledge of the specific industry or market segment mentioned in the job posting.
6. REFRAME EXPERIENCE: Reframe all relevant experience to highlight sales and business development aspects, even from non-sales roles.
` : ''}
Return a structured JSON object that follows this format exactly:
{
  "personalInfo": {firstName, lastName, city, country, phone, email, linkedin},
  "education": [{institution, degree, location, date, details}],
  "skills": {category1: "skill1, skill2", category2: "skill3, skill4"},
  "experience": [{company, title, location, date, achievements}],
  "otherSections": [{title, entries: [{header: {title, date}, subtitle, items}]}]
}`
    },
    {
      role: "user",
      content: `Resume: ${resume}\n\nJob Description: ${jobDescription}\n\nAnalysis: ${JSON.stringify(analysis)}`
    }
  ];

  const result = await makeRequest(messages, apiKey);
  return JSON.parse(result);
};

export const generateCoverLetter = async (resume, jobDescription, analysis, apiKey) => {
  // Check if this is a sales role
  const isSalesRole = jobDescription.toLowerCase().includes('sales') || 
                     jobDescription.toLowerCase().includes('account manager') || 
                     jobDescription.toLowerCase().includes('business development') ||
                     jobDescription.toLowerCase().includes('customer acquisition');

  const messages = [
    {
      role: "system",
      content: `You are a professional cover letter writer. Create a compelling cover letter in plain text format based on the resume, job description, and analysis. Focus on relevant skills and experiences that match the job requirements.
      
${isSalesRole ? `
SALES-SPECIFIC INSTRUCTIONS:
1. SALES ACHIEVEMENTS: Open with a brief but impressive sales achievement that's relevant to the target position.
2. VALUE PROPOSITION: Clearly articulate your unique value proposition as a sales professional - what specific results can you deliver?
3. INDUSTRY KNOWLEDGE: Demonstrate knowledge of the company's market, products, or services.
4. SALES PROCESS: Reference your expertise in aspects of the sales process mentioned in the job description.
5. CUSTOMER FOCUS: Emphasize your customer-centric approach and relationship-building skills.
6. CLOSING STATEMENT: Include a confident, proactive closing statement that expresses your interest in moving forward.
7. QUANTIFIABLE RESULTS: Include at least one quantifiable sales result from your past experience.
` : ''}`
    },
    {
      role: "user",
      content: `Resume: ${resume}\n\nJob Description: ${jobDescription}\n\nAnalysis: ${JSON.stringify(analysis)}`
    }
  ];

  return makeRequest(messages, apiKey);
};

export const generateFollowUpEmail = async (jobDescription, analysis, apiKey) => {
  // Check if this is a sales role
  const isSalesRole = jobDescription.toLowerCase().includes('sales') || 
                     jobDescription.toLowerCase().includes('account manager') || 
                     jobDescription.toLowerCase().includes('business development') ||
                     jobDescription.toLowerCase().includes('customer acquisition');

  const messages = [
    {
      role: "system",
      content: `You are a professional email writer. Create a follow-up email based on the job description and analysis.
      
${isSalesRole ? `
SALES-SPECIFIC FOLLOW-UP INSTRUCTIONS:
1. SUBJECT LINE: Create a direct and engaging subject line that mentions the sales position
2. OPENING: Reference a specific aspect of the company's product, market position, or sales strategy
3. VALUE PROPOSITION: Briefly reiterate your most impressive sales achievement and its relevance
4. PROACTIVE SUGGESTION: Include a brief idea or suggestion related to their sales process or customer acquisition
5. CLEAR CALL TO ACTION: End with a specific, action-oriented request for next steps
6. PROFESSIONAL BUT CONFIDENT TONE: Write in a confident, results-oriented manner appropriate for sales professionals
` : ''}`
    },
    {
      role: "user",
      content: `Job Description: ${jobDescription}\n\nAnalysis: ${JSON.stringify(analysis)}`
    }
  ];

  return makeRequest(messages, apiKey);
}; 