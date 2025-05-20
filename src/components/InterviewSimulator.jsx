import React, { useState, useEffect } from 'react';
import { analyzeResumeFit as openaiAnalyze } from '../api/openai';
import { analyzeResumeFit as deepseekAnalyze } from '../api/deepseek';
import { analyzeResumeFit as geminiAnalyze } from '../api/gemini';
import { useTheme } from '../context/ThemeContext';

const InterviewSimulator = ({ resume, jobDetails, apiKeys, apiKey, defaultProvider = 'openai' }) => {
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
  const [questionTypes] = useState([
    { type: 'technical', icon: '💻' },
    { type: 'behavioral', icon: '🤝' },
    { type: 'problem-solving', icon: '🧩' },
    { type: 'experience', icon: '📊' },
    { type: 'scenario', icon: '🔍' }
  ]);

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
              content: typingMessage
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
      const prompt = `
        Generate a ${currentType} interview question for a ${jobDetails.role} position at ${jobDetails.company}.
        
        Candidate Profile:
        ${resume}

        Job Requirements:
        ${jobDetails.description}

        Previous Questions and Answers:
        ${history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

        IMPORTANT INTERVIEW GUIDELINES:
        1. Question MUST be SPECIFIC to the ${jobDetails.role} role - focus on core job responsibilities
        2. Align with industry standards for this specific position
        3. Test for appropriate experience level (junior/mid/senior) based on job requirements
        4. For technical questions, focus on technologies SPECIFICALLY mentioned in the job description
        5. For behavioral questions, focus on situations relevant to this exact role
        6. For problem-solving, present realistic scenarios the candidate would face in this position
        7. Challenge the candidate appropriately - don't make questions too easy
        8. Be realistic about industry expectations for this role
        
        Generate a question that would help determine if this candidate is truly qualified for THIS SPECIFIC ROLE.
        IMPORTANT: Return only the interview question text with no prefixes or explanations.
      `;

      let response;
      try {
        // If apiKey is provided directly, use it with the default provider
        if (apiKey && defaultProvider === 'gemini') {
          const geminiResponse = await geminiAnalyze(resume, prompt, apiKey);
          response = geminiResponse.recommendations || "Could you tell me about your experience with this role?";
        }
        // Otherwise fall back to the traditional apiKeys object
        else if (apiKeys) {
          if (defaultProvider === 'gemini' && apiKeys.gemini) {
            const geminiResponse = await geminiAnalyze(resume, prompt, apiKeys.gemini);
            response = geminiResponse.recommendations || "Could you tell me about your experience with this role?";
          } else if (apiKeys.selectedProviders?.openai && apiKeys.openai) {
            const openaiResponse = await openaiAnalyze(resume, prompt, apiKeys.openai);
            response = openaiResponse.recommendations || "Could you tell me about your experience with this role?";
          } else if (apiKeys.selectedProviders?.deepseek && apiKeys.deepseek) {
            const deepseekResponse = await deepseekAnalyze(resume, prompt, apiKeys.deepseek);
            response = deepseekResponse.recommendations || "Could you tell me about your experience with this role?";
          } else {
            response = "Could you tell me about your relevant experience for this position?";
          }
        } else {
          response = "Could you tell me about your relevant experience for this position?";
        }
      } catch (error) {
        console.error("Error generating question:", error);
        response = "Could you tell me about your experience that relates to this position?";
      }

      return response;
    } catch (error) {
      console.error('Error generating question:', error);
      return 'Could you tell me about your experience with relevant technologies for this role?';
    } finally {
      setLoading(false);
    }
  };

  const startInterview = async () => {
    setIsInterviewActive(true);
    setMessages([]);
    setQuestionIndex(0);
    setFeedback(null);
    setCurrentQuestionType('');

    const greeting = `Hello! I'm your AI interviewer for the ${jobDetails.role} position at ${jobDetails.company}. I've reviewed your background and I'm looking forward to our conversation. Let's begin with our first question.`;
    
    setMessages([{ role: 'interviewer', content: '', animating: true }]);
    setTypingMessage(greeting);
    setTypingEffect(true);
    
    setTimeout(async () => {
      const firstQuestion = await generateQuestion([]);
      setMessages(prev => [
        { role: 'interviewer', content: greeting, animating: false },
        { role: 'interviewer', content: '', animating: true }
      ]);
      setTypingMessage(firstQuestion);
      setTypingEffect(true);
    }, 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !isInterviewActive || loading) return;

    // Add user's response
    setMessages(prev => [...prev, { role: 'candidate', content: input }]);
    setInput('');
    setLoading(true);

    // Generate next question if not at the end
    if (questionIndex < questionTypes.length - 1) {
      const nextQuestion = await generateQuestion(messages);
      setMessages(prev => [...prev, { role: 'interviewer', content: '', animating: true }]);
      setQuestionIndex(prev => prev + 1);
      setTypingMessage(nextQuestion);
      setTypingEffect(true);
    } else {
      // End interview and generate feedback
      const endMessage = "Thank you for completing the interview. I'll now provide you with feedback on your performance.";
      setMessages(prev => [...prev, { role: 'interviewer', content: '', animating: true }]);
      setTypingMessage(endMessage);
      setTypingEffect(true);
      
      setTimeout(() => {
        generateFeedback();
      }, 1500);
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
      `;

      let feedbackText = "";
      try {
        // If apiKey is provided directly, use it with the default provider
        if (apiKey && defaultProvider === 'gemini') {
          const geminiResponse = await geminiAnalyze(resume, prompt, apiKey);
          feedbackText = geminiResponse.recommendations || "Based on your responses, you demonstrated good knowledge of the role requirements.";
        }
        // Otherwise fall back to the traditional apiKeys object
        else if (apiKeys) {
          if (defaultProvider === 'gemini' && apiKeys.gemini) {
            const geminiResponse = await geminiAnalyze(resume, prompt, apiKeys.gemini);
            feedbackText = geminiResponse.recommendations || "Based on your responses, you demonstrated good knowledge of the role requirements.";
          } else if (apiKeys.selectedProviders?.openai && apiKeys.openai) {
            const openaiResponse = await openaiAnalyze(resume, prompt, apiKeys.openai);
            feedbackText = openaiResponse.recommendations || "Based on your responses, you demonstrated good knowledge of the role requirements.";
          } else if (apiKeys.selectedProviders?.deepseek && apiKeys.deepseek) {
            const deepseekResponse = await deepseekAnalyze(resume, prompt, apiKeys.deepseek);
            feedbackText = deepseekResponse.recommendations || "Based on your responses, you demonstrated good knowledge of the role requirements.";
          } else {
            feedbackText = "Thank you for participating in this practice interview. To provide more detailed feedback, please configure at least one AI provider in the settings.";
          }
        } else {
          feedbackText = "Thank you for participating in this practice interview. To provide more detailed feedback, please configure at least one AI provider in the settings.";
        }
      } catch (error) {
        console.error("Error generating feedback:", error);
        feedbackText = "Thank you for your responses. Based on this practice interview, I recommend preparing more specific examples of your past work and achievements related to the job requirements.";
      }

      setFeedback(feedbackText);
      setIsInterviewActive(false);
    } catch (error) {
      console.error('Error generating feedback:', error);
      setFeedback('Unable to generate feedback at this time. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>Interview Simulator</h2>
        {!isInterviewActive && !feedback && (
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

      {feedback && (
        <div 
          className="mt-8 p-6 rounded-lg space-y-4 animate-fadeIn" 
          style={{
            backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.7)',
            border: `1px solid ${theme.isDarkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)'}`,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          <h3 
            className="text-xl font-semibold" 
            style={{ color: theme.colors.text.primary }}
          >
            <span role="img" aria-label="Feedback">🔍</span> Interview Feedback
          </h3>
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