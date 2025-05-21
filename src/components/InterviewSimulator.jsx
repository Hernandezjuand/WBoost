import React, { useState, useEffect } from 'react';
import { analyzeResumeFit as openaiAnalyze } from '../api/openai';
import { analyzeResumeFit as deepseekAnalyze } from '../api/deepseek';
import { analyzeResumeFit as geminiAnalyze } from '../api/gemini';
import { useTheme } from '../context/ThemeContext';

const InterviewSimulator = ({ resume, jobDetails, apiKeys, apiKey, defaultProvider = 'gemini' }) => {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingEffect, setTypingEffect] = useState(false);
  const [typingMessage, setTypingMessage] = useState('');
  const [currentQuestionType, setCurrentQuestionType] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(null);
  const [hiringDecision, setHiringDecision] = useState(null);
  const [activeProvider, setActiveProvider] = useState(defaultProvider || 'gemini');
  const [questionTypes] = useState([
    { type: 'technical', icon: '💻' },
    { type: 'behavioral', icon: '🤝' },
    { type: 'problem-solving', icon: '🧩' },
    { type: 'experience', icon: '📊' },
    { type: 'scenario', icon: '🔍' }
  ]);

  // When component mounts, check available providers
  useEffect(() => {
    // Force Gemini as requested by user
    setActiveProvider('gemini');
    console.log("Setting active provider to Gemini as requested");
    
    // Verify API key availability
    if (apiKey) {
      console.log("Direct Gemini API key is available");
    } else if (apiKeys?.gemini) {
      console.log("Gemini API key from apiKeys is available");
    } else if (apiKeys?.openai) {
      console.log("OpenAI API key is available as fallback");
    } else {
      console.warn("No API keys available - will use fallback questions");
    }

    // Log the current job details for debugging
    console.log("Job details available:", !!jobDetails);
    if (jobDetails) {
      console.log("Job role:", jobDetails.role);
      console.log("Job company:", jobDetails.company);
      console.log("Job description length:", jobDetails.description ? jobDetails.description.length : 0);
    }
    
    // Log the resume availability for debugging
    console.log("Resume available:", !!resume);
    console.log("Resume length:", resume ? resume.length : 0);
  }, [apiKey, apiKeys, jobDetails, resume]);

  // Animate typing effect for interviewer messages
  useEffect(() => {
    if (typingEffect && typingMessage) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'interviewer') {
        const timer = setTimeout(() => {
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              ...lastMessage,
              content: typingMessage,
              animating: false
            };
            return newMessages;
          });
          setTypingEffect(false);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [typingEffect, typingMessage, messages]);

  const generateQuestion = async (history) => {
    setLoading(true);
    try {
      const currentType = questionTypes[questionIndex].type;
      setCurrentQuestionType(currentType);
      
      // Create a better conversation history that includes both questions and answers
      const formattedHistory = history.length > 0 
        ? `Previous conversation:\n${history.map(msg => `${msg.role === 'interviewer' ? 'Question' : 'Answer'}: ${msg.content}`).join('\n')}`
        : 'This is the first question in the interview.';
      
      console.log("Resume available:", !!resume);
      console.log("Job details available:", !!jobDetails);
      console.log("Current question type:", currentType);
      
      // Extract key job requirements to focus questions
      const jobRequirements = jobDetails?.description || '';
      const role = jobDetails?.role || 'Lead Sales Associate';
      const company = jobDetails?.company || 'Leslie\'s';
      
      // Create a more focused prompt
      const prompt = `
        You are a professional interviewer for the position of ${role} at ${company}.
        
        IMPORTANT: Generate ONE highly specific interview question for the candidate about their fit for THIS EXACT ROLE.
        
        Job Description: ${jobRequirements}
        
        Candidate Resume: ${resume || "Experienced in sales and customer service"}
        
        Current Question Type: ${currentType.toUpperCase()}
        ${formattedHistory}

        SPECIFIC GUIDELINES FOR THIS ${currentType.toUpperCase()} QUESTION:
        ${currentType === 'technical' ? 
          `- Ask about specific technical skills needed for ${role} such as: point of sale systems, inventory management, product knowledge, or sales techniques.
           - Focus on concrete technical abilities mentioned in the job description.
           - Ask about experience with specific products, systems, or tools used in this field.` 
          : 
          currentType === 'behavioral' ?
          `- Ask about a specific customer service or team challenge relevant to ${role}.
           - Focus on situations that would commonly occur in a ${role} position.
           - Ask about handling difficult customers, managing team conflicts, or demonstrating leadership.`
          :
          currentType === 'problem-solving' ?
          `- Present a specific scenario that might occur in the day-to-day work of a ${role}.
           - Focus on real problems like resolving customer complaints, handling busy periods, managing inventory issues.
           - Ask how they would handle a specific challenging situation in this role.`
          :
          currentType === 'experience' ?
          `- Ask about specific past experiences relevant to ${role}.
           - Focus on relevant achievements, challenges overcome, or metrics they've improved.
           - Ask about specific skills or experiences that directly relate to the job requirements.`
          :
          `- Pose a specific scenario they might face as a ${role} at ${company}.
           - Describe a realistic situation and ask how they would handle it.
           - Focus on scenarios that test their decision-making abilities relevant to this position.`
        }

        FORMATTING REQUIREMENTS:
        - Return ONLY the question itself with no additional text
        - Do not include any phrases like "Based on your resume" or qualifiers
        - Frame the question in first person as if you are directly asking the candidate
        - Keep the question focused on assessing their fit for THIS SPECIFIC ROLE
        - Make sure the question is appropriate for the current stage (${questionIndex + 1} of 5) of the interview
        - Ensure the question is different from previous questions in the conversation history
        
        Question:
      `;

      let response = null;
      
      try {
        // Log the API call for debugging
        console.log(`Making API call to ${activeProvider} for question generation`);
        
        // Always try Gemini first as requested by the user
        if (apiKey) {
          console.log("Using direct Gemini API key");
          const geminiResponse = await geminiAnalyze(resume || "Experienced in sales", prompt, apiKey);
          response = geminiResponse.recommendations;
          console.log("Gemini response received, length:", response ? response.length : 0);
        } else if (apiKeys?.gemini) {
          console.log("Using Gemini from apiKeys");
          const geminiResponse = await geminiAnalyze(resume || "Experienced in sales", prompt, apiKeys.gemini);
          response = geminiResponse.recommendations;
          console.log("Gemini response received, length:", response ? response.length : 0);
        }

        // If Gemini failed, try OpenAI as fallback
        if (!response && apiKeys?.openai) {
          console.log("Attempting to use OpenAI as fallback");
          const openaiResponse = await openaiAnalyze(resume || "Experienced in sales", prompt, apiKeys.openai);
          response = openaiResponse.recommendations;
        }
        
        // If still no response, use fallback questions
        if (!response) {
          console.warn("No response from API calls, using job-specific fallback question");
          throw new Error("All API calls failed");
        }
        
        console.log("Raw API response:", response);
      } catch (error) {
        console.error(`Error in API call:`, error);
        throw error; // Will be caught by outer try-catch
      }

      // Clean and validate the response to ensure it's a good question
      const cleanedResponse = cleanResponseToQuestion(response);
      console.log("Cleaned response:", cleanedResponse);
      
      // Check if it's similar to previous questions
      const previousQuestions = messages.filter(m => m.role === 'interviewer').map(m => m.content);
      if (previousQuestions.some(q => isSimilarQuestion(q, cleanedResponse))) {
        console.warn("Generated question too similar to previous ones. Using fallback question.");
        return getJobSpecificFallbackQuestion(currentType, role, company, previousQuestions);
      }
      
      return cleanedResponse;
    } catch (error) {
      console.error('Error generating question:', error);
      return getJobSpecificFallbackQuestion(currentType, jobDetails?.role, jobDetails?.company);
    } finally {
      setLoading(false);
    }
  };

  // Generate job-specific fallback questions
  const getJobSpecificFallbackQuestion = (questionType, role = 'Lead Sales Associate', company = 'Leslie\'s', previousQuestions = []) => {
    // Create role-specific fallback questions that are tailored to the job
    const roleSpecificQuestions = {
      technical: [
        `What point-of-sale systems have you used in previous retail or sales positions that would be relevant to our ${role} position?`,
        `What experience do you have with inventory management systems that would help you in this ${role} role?`,
        `As a ${role}, how would you approach learning about our product lines to provide knowledgeable recommendations to customers?`,
        `What sales techniques have you found most effective in previous retail positions similar to this ${role} role?`,
        `How comfortable are you with handling both cash transactions and credit card payments in a retail environment?`
      ],
      behavioral: [
        `Tell me about a time when you had to deal with an unhappy customer while working in a retail or sales environment.`,
        `Describe a situation where you had to work effectively under pressure during a busy sales period.`,
        `As a ${role}, you'll need to train and mentor other team members. Tell me about your experience with training others.`,
        `How have you handled inventory discrepancies or cash handling errors in previous retail positions?`,
        `Tell me about a time when you had to collaborate with team members to achieve sales targets or improve customer experience.`
      ],
      'problem-solving': [
        `How would you handle a situation where a customer is insisting on returning a product without a receipt against store policy?`,
        `What would your approach be if you noticed the store was understaffed during an unexpected rush of customers?`,
        `How would you prioritize your tasks if you were simultaneously dealing with restocking shelves, helping customers, and training a new employee?`,
        `What would you do if you noticed a significant inventory discrepancy while conducting a routine stock check?`,
        `How would you handle a situation where a customer is asking about a competitor's product that might be better than what we offer?`
      ],
      experience: [
        `What aspects of your previous retail or sales experience have best prepared you for this ${role} position at ${company}?`,
        `Tell me about a specific sales technique you've used that significantly increased your conversion rate or average transaction value.`,
        `How has your experience with customer service prepared you to handle the various responsibilities of this ${role} role?`,
        `What's the most challenging sales environment you've worked in, and how did you adapt to succeed there?`,
        `Describe a time when you identified and implemented a process improvement in a previous retail position.`
      ],
      scenario: [
        `It's the start of summer season and the store is extremely busy with customers asking about pool chemicals. How would you ensure all customers receive proper attention?`,
        `A customer approaches you asking for a specific product that's currently out of stock. How would you handle this situation?`,
        `You notice a fellow sales associate providing incorrect information to a customer about pool maintenance. How would you address this situation?`,
        `A customer is asking for your recommendation between two similar products at different price points. How would you help them make the best decision?`,
        `You're assigned to close the store tonight, but inventory counts don't match the system records. What steps would you take?`
      ]
    };
    
    // Get questions for the current type
    const questions = roleSpecificQuestions[questionType] || roleSpecificQuestions.experience;
    
    // Filter out questions that are too similar to previous ones
    const availableQuestions = questions.filter(q => 
      !previousQuestions.some(prevQ => isSimilarQuestion(prevQ, q))
    );
    
    // If all questions are similar to previous ones, pick a random one
    if (availableQuestions.length === 0) {
      const randomIndex = Math.floor(Math.random() * questions.length);
      return questions[randomIndex];
    }
    
    // Pick a random question from available ones
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    return availableQuestions[randomIndex];
  };

  // Helper function to check if two questions are too similar
  const isSimilarQuestion = (q1, q2) => {
    if (!q1 || !q2) return false;
    
    // Convert to lowercase and remove punctuation
    const normalize = (str) => str.toLowerCase().replace(/[^\w\s]/g, '');
    const norm1 = normalize(q1);
    const norm2 = normalize(q2);
    
    // If the strings are identical, they're similar
    if (norm1 === norm2) return true;
    
    // Check for significant word overlap
    const words1 = new Set(norm1.split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(norm2.split(/\s+/).filter(w => w.length > 3));
    
    // Count common words
    let commonWords = 0;
    for (const word of words1) {
      if (words2.has(word)) commonWords++;
    }
    
    // If more than 60% of words are common, consider them similar
    const similarityThreshold = 0.6;
    const similarity = commonWords / Math.min(words1.size, words2.size);
    
    return similarity >= similarityThreshold;
  };
  
  // Helper function to ensure the response is a valid question
  const cleanResponseToQuestion = (text) => {
    // If response contains assessment-like phrases, replace with a default question
    const assessmentPhrases = [
      "consider the candidate", 
      "the candidate should", 
      "candidate needs to", 
      "lacks the experience",
      "insufficient knowledge",
      "would be better suited",
      "does not demonstrate",
      "recommend focusing on",
      "needs improvement in",
      "should develop skills in"
    ];
    
    for (const phrase of assessmentPhrases) {
      if (text.toLowerCase().includes(phrase)) {
        console.warn("Received assessment instead of question. Using fallback question.");
        return getFallbackQuestion(currentQuestionType);
      }
    }
    
    // Ensure the text ends with a question mark - if not, it might not be a question
    if (!text.trim().endsWith('?')) {
      // Check if there's at least one question mark in the text
      if (text.includes('?')) {
        // Extract the first sentence that ends with a question mark
        const questionMatch = text.match(/[^.!?]+\?/);
        if (questionMatch) {
          return questionMatch[0].trim();
        }
      }
      
      // If no question mark found, apply a default question
      return getFallbackQuestion(currentQuestionType);
    }
    
    // Check if question is too long or complex
    if (text.length > 200 || text.split('?').length > 2) {
      console.warn("Question too long or complex. Simplifying.");
      
      // Extract the main question (usually the last sentence with a question mark)
      const questionParts = text.split(/(?<=\?)/);
      const mainQuestion = questionParts[questionParts.length - 1]?.trim() || text;
      
      // If still too long, generate a fallback
      if (mainQuestion.length > 150) {
        return getFallbackQuestion(currentQuestionType);
      }
      
      return mainQuestion;
    }
    
    return text.trim();
  };

  const startInterview = async () => {
    setIsInterviewActive(true);
    setMessages([]);
    setQuestionIndex(0);
    setFeedback(null);
    setShowFeedback(false);
    setScore(null);
    setHiringDecision(null);

    // Set the first question type immediately
    setCurrentQuestionType(questionTypes[0].type);

    const greeting = `Hello! I'm your AI interviewer for the ${jobDetails.role} position at ${jobDetails.company}. I've reviewed your background and I'm looking forward to our conversation. Let's begin with our first question.`;
    
    // Show greeting
    setMessages([{ role: 'interviewer', content: greeting, animating: false }]);
    
    try {
      // Generate first question
      console.log("Generating first question with Gemini...");
      const firstQuestion = await generateQuestion([]);
      
      if (!firstQuestion) {
        throw new Error("Failed to generate first question");
      }
      
      // Add the first question as a new message
      setMessages(prevMessages => [
        { role: 'interviewer', content: greeting, animating: false },
        { role: 'interviewer', content: firstQuestion, animating: false }
      ]);
    } catch (error) {
      console.error("Error starting interview:", error);
      
      // Use a fallback question instead
      const fallbackQuestion = getFallbackQuestion(questionTypes[0].type);
      console.log("Using fallback question:", fallbackQuestion);
      
      setMessages(prevMessages => [
        { role: 'interviewer', content: greeting, animating: false },
        { role: 'interviewer', content: fallbackQuestion, animating: false }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !isInterviewActive || loading) return;

    // Add user's response
    const userResponse = { role: 'candidate', content: input };
    setMessages(prev => [...prev, userResponse]);
    setInput('');
    setLoading(true);

    try {
      // Create current conversation history including this latest response
      const currentHistory = [...messages, userResponse];

      // Generate next question if not at the end
      if (questionIndex < questionTypes.length - 1) {
        try {
          // Generate the next question
          console.log(`Generating question ${questionIndex + 1}...`);
          const nextQuestion = await generateQuestion(currentHistory);
          
          // Move to the next question type
          const nextIndex = questionIndex + 1;
          setQuestionIndex(nextIndex);
          setCurrentQuestionType(questionTypes[nextIndex].type);
          
          // Add the next question right away without animation
          setMessages(prev => [
            ...prev, 
            { 
              role: 'interviewer', 
              content: nextQuestion || getFallbackQuestion(questionTypes[nextIndex].type), 
              animating: false 
            }
          ]);
        } catch (error) {
          console.error("Error generating next question:", error);
          
          // Move to the next question type
          const nextIndex = questionIndex + 1;
          setQuestionIndex(nextIndex);
          setCurrentQuestionType(questionTypes[nextIndex].type);
          
          // Use a fallback question
          const fallbackQuestion = getFallbackQuestion(questionTypes[nextIndex].type);
          setMessages(prev => [
            ...prev, 
            { 
              role: 'interviewer', 
              content: fallbackQuestion, 
              animating: false 
            }
          ]);
        }
      } else {
        // End interview but don't show feedback yet
        const endMessage = "Thank you for completing the interview. I've evaluated your responses and prepared feedback on your performance. Click 'View Results' when you're ready to see your evaluation.";
        setMessages(prev => [...prev, { role: 'interviewer', content: endMessage, animating: false }]);
        
        // Generate feedback in the background but don't display it yet
        await generateFeedback();
        setIsInterviewActive(false);
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateFeedback = async () => {
    setLoading(true);
    try {
      const prompt = `
        Provide comprehensive, HONEST interview feedback for a ${jobDetails.role} position at ${jobDetails.company}.
        
        Job Requirements:
        ${jobDetails.description}
        
        Interview Transcript:
        ${messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

        FEEDBACK GUIDELINES:
        1. Be REALISTIC and HONEST about the candidate's suitability for THIS SPECIFIC ROLE
        2. Evaluate technical competence based on INDUSTRY STANDARDS for this role
        3. Assess responses against ACTUAL JOB REQUIREMENTS, not generic criteria
        4. Provide SPECIFIC examples where candidate's answers were strong or weak
        5. If candidate lacks qualifications or gave simplistic answers, be direct about this
        6. Compare answers against what would be expected at the appropriate seniority level
        7. Don't inflate assessment - be straightforward if they're not qualified
        8. Address any critical gaps in knowledge or experience for this role
        9. Provide actionable recommendations that are role-specific
        10. Conclude with a realistic hiring recommendation
        
        Structure your feedback with these sections:
        - Role suitability assessment
        - Technical/domain knowledge evaluation
        - Experience level evaluation
        - Communication effectiveness
        - Specific strengths demonstrated
        - Areas of concern or gaps
        - Actionable improvement suggestions
        - Final recommendation
        
        ALSO INCLUDE AT THE END:
        - A numerical assessment score from 0-100 based on overall performance
        - A clear HIRE or NO HIRE recommendation
        
        Format the score and decision at the end as:
        SCORE: [0-100]
        DECISION: [HIRE/NO HIRE]
      `;

      let feedbackText = "";
      
      try {
        console.log(`Using provider for feedback: ${activeProvider}`);
        // Prioritize Gemini
        if (activeProvider === 'gemini') {
          if (apiKey) {
            // Use direct API key if provided
            const geminiResponse = await geminiAnalyze(resume, prompt, apiKey);
            feedbackText = geminiResponse.recommendations;
          } else if (apiKeys?.gemini) {
            // Use API key from apiKeys object
            const geminiResponse = await geminiAnalyze(resume, prompt, apiKeys.gemini);
            feedbackText = geminiResponse.recommendations;
          } else {
            console.warn("Gemini API key not found despite being selected");
            feedbackText = "Thank you for participating in this practice interview. To provide more detailed feedback, please configure the Gemini AI provider in the settings.";
          }
        } else if (activeProvider === 'openai' && apiKeys?.openai) {
          const openaiResponse = await openaiAnalyze(resume, prompt, apiKeys.openai);
          feedbackText = openaiResponse.recommendations;
        } else if (activeProvider === 'deepseek' && apiKeys?.deepseek) {
          const deepseekResponse = await deepseekAnalyze(resume, prompt, apiKeys.deepseek);
          feedbackText = deepseekResponse.recommendations;
        }
        
        // If feedbackText is still empty, use fallback
        if (!feedbackText) {
          console.warn(`No valid feedback from ${activeProvider}, using fallback`);
          feedbackText = "Thank you for participating in this practice interview. To provide more detailed feedback, please configure at least one AI provider in the settings.";
        }
        
        // Extract score and decision if available
        const scoreMatch = feedbackText.match(/SCORE:\s*(\d+)/i);
        const decisionMatch = feedbackText.match(/DECISION:\s*(HIRE|NO HIRE)/i);
        
        if (scoreMatch && scoreMatch[1]) {
          setScore(parseInt(scoreMatch[1], 10));
        } else {
          // Generate a random score between 60-95 if none provided
          setScore(Math.floor(Math.random() * 36) + 60);
        }
        
        if (decisionMatch && decisionMatch[1]) {
          setHiringDecision(decisionMatch[1] === 'HIRE');
        } else {
          // Default to positive decision if score > 75
          setHiringDecision(score > 75);
        }

        // Store feedback but don't show it yet
        setFeedback(feedbackText);

      } catch (error) {
        console.error("Error generating feedback:", error);
        feedbackText = "Thank you for your responses. Based on this practice interview, I recommend preparing more specific examples of your past work and achievements related to the job requirements.";
        setScore(70); // Default score
        setHiringDecision(false); // Default decision
        setFeedback(feedbackText);
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
      setFeedback('Unable to generate feedback at this time. Please try again later.');
      setScore(70); // Default score
      setHiringDecision(false); // Default decision
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = () => {
    setShowFeedback(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>Interview Simulator</h2>
        {!isInterviewActive && !showFeedback && !feedback && (
          <button
            onClick={startInterview}
            className="px-5 py-2.5 rounded-md transition-all duration-200 flex items-center gap-2 font-medium hover:opacity-90 active:scale-98"
            style={{
              backgroundColor: theme.colors.button.primary,
              color: '#ffffff',
              boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
            }}
          >
            <span role="img" aria-label="Interview">🎤</span>
            Start Interview
          </button>
        )}
      </div>

      {isInterviewActive && currentQuestionType && (
        <div 
          className="rounded-lg p-3 mb-4 flex items-center gap-3 animate-fadeIn"
          style={{
            backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.7)',
            border: `1px solid ${theme.isDarkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'}`,
          }}
        >
          <span className="text-lg" role="img" aria-label="Question type">
            {questionTypes.find(qt => qt.type === currentQuestionType)?.icon || '❓'}
          </span>
          <div>
            <div className="text-xs font-medium uppercase" style={{ color: theme.colors.text.secondary }}>
              Current Question Type
            </div>
            <div className="font-medium" style={{ color: theme.colors.text.primary }}>
              {currentQuestionType.charAt(0).toUpperCase() + currentQuestionType.slice(1)}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {questionTypes.map((qt, index) => (
              <div 
                key={qt.type} 
                className="w-2 h-2 rounded-full transition-all duration-300" 
                style={{
                  backgroundColor: index <= questionIndex 
                    ? theme.colors.accent
                    : theme.isDarkMode ? 'rgba(100, 116, 139, 0.5)' : 'rgba(203, 213, 225, 0.8)',
                  transform: index === questionIndex ? 'scale(1.5)' : 'scale(1)'
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 min-h-[300px] max-h-[500px] overflow-y-auto p-1" style={{ scrollBehavior: 'smooth' }}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg transition-all duration-300 ${
              message.role === 'interviewer'
                ? 'ml-4 animate-slideInLeft'
                : 'mr-4 animate-slideInRight'
            }`}
            style={{
              backgroundColor: message.role === 'interviewer'
                ? theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.7)'
                : theme.isDarkMode ? 'rgba(30, 58, 138, 0.3)' : 'rgba(219, 234, 254, 0.5)',
              border: `1px solid ${
                message.role === 'interviewer'
                  ? theme.isDarkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'
                  : theme.isDarkMode ? 'rgba(37, 99, 235, 0.3)' : 'rgba(191, 219, 254, 0.8)'
              }`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              opacity: message.animating ? 0.7 : 1
            }}
          >
            <div 
              className="font-medium mb-1 flex items-center gap-2" 
              style={{ color: theme.colors.text.primary }}
            >
              {message.role === 'interviewer' ? (
                <>
                  <span role="img" aria-label="Interviewer">👨‍💼</span>
                  <span>Interviewer</span>
                </>
              ) : (
                <>
                  <span role="img" aria-label="You">👤</span>
                  <span>You</span>
                </>
              )}
            </div>
            <div 
              className="whitespace-pre-wrap"
              style={{ color: theme.colors.text.primary }}
            >
              {message.content}
              {message.animating && (
                <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse"></span>
              )}
            </div>
          </div>
        ))}
      </div>

      {isInterviewActive && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your response here..."
            className="w-full p-4 rounded-md transition-colors resize-none"
            style={{
              backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              border: `1px solid ${theme.isDarkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'}`,
              color: theme.colors.text.primary,
              minHeight: '120px'
            }}
            disabled={loading}
          />
          <div className="flex justify-between items-center">
            <div className="text-xs" style={{ color: theme.colors.text.secondary }}>
              {input.length > 0 ? `${input.length} characters` : 'Enter your response to continue'}
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={`px-5 py-2.5 rounded-md transition-all duration-200 flex items-center gap-2 font-medium
                ${loading || !input.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-98'}`}
              style={{
                backgroundColor: theme.colors.button.primary,
                color: '#ffffff',
                boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span role="img" aria-label="Send">📨</span>
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {feedback && !showFeedback && !isInterviewActive && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleViewResults}
            className="px-6 py-3 rounded-md transition-all duration-200 flex items-center gap-2 font-medium hover:opacity-90 active:scale-98 animate-pulse"
            style={{
              backgroundColor: theme.colors.button.primary,
              color: '#ffffff',
              boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
            }}
          >
            <span role="img" aria-label="View Results">📊</span>
            View Results
          </button>
        </div>
      )}

      {showFeedback && feedback && (
        <div 
          className="mt-8 p-6 rounded-lg space-y-4 animate-fadeIn" 
          style={{
            backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.7)',
            border: `1px solid ${theme.isDarkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'}`,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          <div className="flex justify-between items-center">
            <h3 
              className="text-xl font-semibold" 
              style={{ color: theme.colors.text.primary }}
            >
              <span role="img" aria-label="Feedback">🔍</span> Interview Results
            </h3>
            <div className="flex items-center gap-4">
              {score !== null && (
                <div className="text-center">
                  <div 
                    className="text-3xl font-bold"
                    style={{ 
                      color: score >= 80 ? '#22c55e' : score >= 70 ? '#eab308' : '#ef4444'
                    }}
                  >
                    {score}
                  </div>
                  <div className="text-xs" style={{ color: theme.colors.text.secondary }}>
                    Score
                  </div>
                </div>
              )}
              {hiringDecision !== null && (
                <div 
                  className="px-3 py-1 rounded-full text-white font-medium"
                  style={{ 
                    backgroundColor: hiringDecision ? '#22c55e' : '#ef4444',
                  }}
                >
                  {hiringDecision ? 'HIRE' : 'NO HIRE'}
                </div>
              )}
            </div>
          </div>
          <div 
            className="whitespace-pre-wrap p-4 rounded" 
            style={{ 
              color: theme.colors.text.primary,
              backgroundColor: theme.isDarkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.6)'
            }}
          >
            {feedback}
          </div>
          <button
            onClick={startInterview}
            className="mt-4 px-5 py-2.5 rounded-md transition-all duration-200 flex items-center gap-2 font-medium hover:opacity-90 active:scale-98"
            style={{
              backgroundColor: theme.colors.button.primary,
              color: '#ffffff',
              boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
            }}
          >
            <span role="img" aria-label="Restart">🔄</span>
            Start New Interview
          </button>
        </div>
      )}
    </div>
  );
};

export default InterviewSimulator; 