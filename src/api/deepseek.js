import axios from 'axios';

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const TIMEOUT = 120000; // Increased to 2 minutes
const MAX_TOKENS = 4000; // Increased token limit

// Document templates
const TEMPLATES = {
  MODERN: {
    name: 'Modern'
  },
  PROFESSIONAL: {
    name: 'Professional'
  },
  MINIMAL: {
    name: 'Minimal'
  }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logStep = (step, details) => {
  console.log(`[DeepSeek] Step ${step}:`, details);
};

const cleanJsonResponse = (response) => {
  // Remove markdown code block syntax
  let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  // If response is empty after cleaning, throw error
  if (!cleaned) {
    throw new Error('Empty response after cleaning');
  }
  return cleaned;
};

const makeRequest = async (messages, apiKey, retryCount = 0) => {
  logStep('Request', {
    attempt: retryCount + 1,
    maxRetries: MAX_RETRIES,
    messageCount: messages.length
  });

  try {
    const response = await axios.post(
      DEEPSEEK_URL,
      {
        model: 'deepseek-chat',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: MAX_TOKENS
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: TIMEOUT
      }
    );

    logStep('Response', {
      status: response.status,
      hasContent: !!response.data?.choices?.[0]?.message?.content
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    return response.data.choices[0].message.content;
  } catch (error) {
    logStep('Error', {
      message: error.message,
      status: error.response?.status,
      retryCount
    });

    // Handle timeout specifically
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        logStep('Timeout', { delay, nextAttempt: retryCount + 1 });
        await sleep(delay);
        return makeRequest(messages, apiKey, retryCount + 1);
      }
      throw new Error('Request timed out after multiple retries');
    }

    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount);
      logStep('Retry', { delay, nextAttempt: retryCount + 1 });
      await sleep(delay);
      return makeRequest(messages, apiKey, retryCount + 1);
    }
    throw new Error(`DeepSeek API Error: ${error.message}`);
  }
};

export const analyzeResumeFit = async (resume, jobDescription, apiKey) => {
  logStep('Analysis', 'Starting resume analysis');
  
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
        logStep('Analysis', 'Warning: Could not stringify job description object');
      }
    }
  }
  
  // Ensure we have a non-empty string
  if (!processedJobDescription || typeof processedJobDescription !== 'string' || processedJobDescription.trim() === '') {
    logStep('Analysis', 'Error: Empty or invalid job description', {
      type: typeof processedJobDescription,
      isEmpty: !processedJobDescription,
      length: processedJobDescription ? processedJobDescription.length : 0
    });
    processedJobDescription = "No job description provided";
  }
  
  // Log what we're sending
  logStep('Analysis', 'Processed job description', {
    length: processedJobDescription.length,
    preview: processedJobDescription.substring(0, 100) + '...',
    resume_length: typeof resume === 'string' ? resume.length : 'not a string'
  });
  
  const messages = [
    {
      role: 'system',
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
5. Use industry standards for experience levels (junior, mid, senior)
6. Be honest about missing critical requirements

Return ONLY a raw JSON object with the following structure:
{
  "jobAnalysis": {
    "coreResponsibilities": string[],
    "requiredSkills": string[],
    "requiredExperience": string,
    "industryKnowledge": string
  },
  "overallFit": number,
  "skillsMatch": number,
  "experienceRelevance": number,
  "educationAlignment": number,
  "roleAppropriateLevel": number,
  "missingSkills": string[],
  "criticalGaps": string[],
  "strengths": string[],
  "weaknesses": string[],
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
      role: 'user',
      content: `Analyze this resume against the job description and provide a DETAILED, HONEST, and BALANCED assessment.

Step 1: Analyze the job description in detail (50% of your focus)
   - Identify the specific job role and core responsibilities
   - List the key technical skills and qualifications required (be SPECIFIC)
   - Determine the level of experience needed (EXACT years if mentioned)
   - Identify any industry-specific requirements
   - Extract EXACT technology names, frameworks, and tools mentioned

Step 2: Evaluate the candidate's qualifications (50% of your focus)
   - Assess how each of the candidate's skills and experiences matches the job requirements
   - Identify strengths and weaknesses specifically related to the job requirements
   - Provide a balanced view of the candidate's fit for this specific role

Resume: ${resume}
Job Description: ${processedJobDescription}

Return ONLY the raw JSON object, no markdown formatting or additional text.`
    }
  ];

  try {
    logStep('Analysis', 'Sending analysis request');
    const response = await makeRequest(messages, apiKey);
    
    logStep('Analysis', 'Cleaning response');
    const cleanedResponse = cleanJsonResponse(response);
    
    logStep('Analysis', 'Parsing response');
    const parsed = JSON.parse(cleanedResponse);
    
    // Log the exact structure we received
    logStep('Analysis', 'Response structure debug', {
      hasOverallFit: !!parsed.overallFit,
      hasCandidateAssessment: !!parsed.candidateAssessment,
      candidateAssessmentType: typeof parsed.candidateAssessment,
      hasJobAnalysis: !!parsed.jobAnalysis,
      hasFeedback: !!parsed.feedback,
      topLevelKeys: Object.keys(parsed),
      isArray: Array.isArray(parsed)
    });
    
    // Super permissive validation - accept almost any structure and normalize it
    logStep('Analysis', 'Normalizing data');
    
    // Create a normalized structure with default values for everything
    const normalizedResult = {
      overallFit: 0,
      skillsMatch: 0,
      experienceRelevance: 0,
      educationAlignment: 0,
      roleAppropriateLevel: 0,
      missingSkills: [],
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
      normalizedResult.missingSkills = parsed.missingSkills || 
                                     parsed.gapAnalysis?.missingRequirements || 
                                     parsed.missing_skills || 
                                     parsed.missing_requirements || 
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
      
      // Log the normalized result
      logStep('Analysis', 'Normalized data successfully');
      
    } catch (normalizationError) {
      logStep('Analysis', 'Error during normalization', {
        message: normalizationError.message,
        stack: normalizationError.stack
      });
      // Continue with whatever we were able to normalize
    }
    
    logStep('Analysis', 'Analysis completed successfully');
    return normalizedResult;
  } catch (error) {
    logStep('Analysis Error', {
      message: error.message,
      type: error.name,
      stack: error.stack
    });
    throw new Error(`Analysis failed: ${error.message}`);
  }
};

export const generateResume = async (resume, jobDescription, analysis, apiKey, template = 'MODERN') => {
  logStep('Resume', 'Starting resume optimization');
  
  const messages = [
    {
      role: 'system',
      content: `You are an expert resume optimizer specializing in ATS (Applicant Tracking System) optimization.

Your primary goal is to create a resume that will achieve a 95%+ match rate with the provided job description, while being completely truthful and maintaining the candidate's actual experience and skills.

SPECIFIC OPTIMIZATION INSTRUCTIONS:
1. KEYWORD TARGETING: Identify and incorporate exact keywords and phrases from the job description. Mirror the exact terminology and phrasing used in the job posting. This is the HIGHEST priority.
2. JOB-CENTRIC APPROACH: First analyze the job requirements thoroughly, then tailor EVERY element of the resume to address those specific requirements directly.
3. SKILL PRIORITIZATION: Highlight skills that directly match the job requirements by placing them prominently at the top of skills section and emphasize them in experience descriptions.
4. EXPERIENCE RESHAPING: Reorganize experience bullet points to showcase responsibilities and achievements that directly relate to the target job requirements first.
5. QUANTIFIABLE ACHIEVEMENTS: Transform generic statements into specific, measurable results where possible (e.g., "Increased sales by 20%" instead of "Improved sales").
6. JOB TITLE ALIGNMENT: If the candidate's actual experience could reasonably fit the job title terminology used in the posting, use matching terminology.
7. ROLE-SPECIFIC LANGUAGE: Use industry-specific terminology from the job description throughout the resume.
8. BREVITY: Keep all bullet points under 12 words each. Use strong action verbs and eliminate unnecessary words.
9. LENGTH: Ensure the resume will fit on a SINGLE PAGE. Be ruthless about prioritizing only the most relevant experience.
10. ADDRESS GAPS: If the analysis identified missing requirements or skills, try to bridge these gaps by highlighting transferable skills or related experiences.

Think of this as creating a direct "response" to the job description, where each line of the resume addresses specific requirements from the job posting.

Do not use LaTeX formatting. Instead, return a clean, structured JSON object with the following format:
{
  "personalInfo": {
    "firstName": "",
    "lastName": "",
    "city": "",
    "country": "",
    "phone": "",
    "email": "",
    "linkedin": ""
  },
  "education": [
    {
      "institution": "",
      "degree": "",
      "location": "",
      "date": "",
      "details": []
    }
  ],
  "skills": {
    "category1": "skill1, skill2, skill3",
    "category2": "skill4, skill5, skill6"
  },
  "experience": [
    {
      "company": "",
      "title": "",
      "location": "",
      "date": "",
      "achievements": []
    }
  ],
  "otherSections": [
    {
      "title": "",
      "entries": [
        {
          "header": {
            "title": "",
            "date": ""
          },
          "subtitle": "",
          "items": []
        }
      ]
    }
  ]
}`
    },
    {
      role: 'user',
      content: `Generate optimized resume content based on the analysis feedback.

Resume: ${resume}
Job Description: ${jobDescription}
Analysis: ${JSON.stringify(analysis)}

IMPORTANT INSTRUCTIONS:
1. Use the exact name and personal details from the provided resume
2. Do not make up or change any personal information
3. Focus heavily on matching the exact terminology and requirements from the job description
4. Reorganize and rewrite experience to directly target the job requirements
5. Return ONLY the structured JSON object with the resume content`
    }
  ];

  try {
    logStep('Resume', 'Sending optimization request');
    const response = await makeRequest(messages, apiKey);
    logStep('Resume', 'Resume optimization completed');
    
    // Parse the JSON response
    const cleanedResponse = cleanJsonResponse(response);
    const parsedResponse = JSON.parse(cleanedResponse);
    
    return parsedResponse;
  } catch (error) {
    logStep('Resume Error', {
      message: error.message,
      type: error.name
    });
    throw new Error(`Resume optimization failed: ${error.message}`);
  }
};

export const generateCoverLetter = async (resume, jobDescription, analysis, apiKey, template = 'MODERN') => {
  logStep('Cover Letter', 'Starting cover letter generation');
  
  const messages = [
    {
      role: 'system',
      content: `You are a cover letter writing expert. Generate a professional cover letter based on the resume and analysis feedback. Focus on creating a concise, compelling letter that demonstrates why the candidate is a good fit for the position.

Return plain text formatted cover letter with appropriate paragraph breaks and structure.`
    },
    {
      role: 'user',
      content: `Generate a professional cover letter based on the resume and analysis feedback.

Resume: ${resume}
Job Description: ${jobDescription}
Analysis: ${JSON.stringify(analysis)}

Return the cover letter in plain text format.`
    }
  ];

  try {
    logStep('Cover Letter', 'Sending generation request');
    const response = await makeRequest(messages, apiKey);
    logStep('Cover Letter', 'Cover letter generation completed');
    
    return {
      content: response
    };
  } catch (error) {
    logStep('Cover Letter Error', {
      message: error.message,
      type: error.name
    });
    throw new Error(`Cover letter generation failed: ${error.message}`);
  }
};

export const generateFollowUpEmail = async (jobDescription, analysis, apiKey, template = 'MODERN') => {
  logStep('Email', 'Starting follow-up email generation');
  
  const messages = [
    {
      role: 'system',
      content: `You are an email writing expert. Generate a professional follow-up email based on the analysis feedback. Focus on creating a concise, effective message.

Return plain text formatted email with appropriate paragraph breaks and structure.`
    },
    {
      role: 'user',
      content: `Generate a professional follow-up email based on the analysis feedback.

Job Description: ${jobDescription}
Analysis: ${JSON.stringify(analysis)}

Return the email in plain text format.`
    }
  ];

  try {
    logStep('Email', 'Sending generation request');
    const response = await makeRequest(messages, apiKey);
    logStep('Email', 'Email generation completed');
    
    return {
      content: response
    };
  } catch (error) {
    logStep('Email Error', {
      message: error.message,
      type: error.name
    });
    throw new Error(`Email generation failed: ${error.message}`);
  }
}; 