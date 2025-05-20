import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { analyzeResumeFit as openaiAnalyze, generateResume as openaiGenerateResume, generateCoverLetter as openaiGenerateCoverLetter, generateFollowUpEmail as openaiGenerateFollowUpEmail } from './api/openai';
import { analyzeResumeFit as deepseekAnalyze, generateResume as deepseekGenerateResume, generateCoverLetter as deepseekGenerateCoverLetter, generateFollowUpEmail as deepseekGenerateFollowUpEmail } from './api/deepseek';
import { analyzeResumeFit as geminiAnalyze, generateResume as geminiGenerateResume, generateCoverLetter as geminiGenerateCoverLetter, generateFollowUpEmail as geminiGenerateFollowUpEmail } from './api/gemini';
import ApiKeyManager from './components/ApiKeyManager';
import ResumeUploader from './components/ResumeUploader';
import JobPostForm from './components/JobPostForm';
import AIJobDetailsInput from './components/AIJobDetailsInput';
import AnalysisResults from './components/AnalysisResults';
import GeneratedDocuments from './components/GeneratedDocuments';
import ApplicationsTracker from './components/ApplicationsTracker';
import ThemeToggle from './components/ThemeToggle';
import QuickApplyForm from './components/QuickApplyForm';
import InterviewSimulator from './components/InterviewSimulator';
import LinkedInMessageGenerator from './components/LinkedInMessageGenerator';
import DailyJobs from './components/DailyJobs';
import './App.css';

// Add React DevTools message
if (process.env.NODE_ENV === 'development') {
  console.log('Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools');
}

// AI Providers configuration
const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    analyze: openaiAnalyze,
    generateResume: openaiGenerateResume,
    generateCoverLetter: openaiGenerateCoverLetter,
    generateFollowUpEmail: openaiGenerateFollowUpEmail
  },
  deepseek: {
    name: 'DeepSeek',
    analyze: deepseekAnalyze,
    generateResume: deepseekGenerateResume,
    generateCoverLetter: deepseekGenerateCoverLetter,
    generateFollowUpEmail: deepseekGenerateFollowUpEmail
  },
  gemini: {
    name: 'Gemini',
    analyze: geminiAnalyze,
    generateResume: geminiGenerateResume,
    generateCoverLetter: geminiGenerateCoverLetter,
    generateFollowUpEmail: geminiGenerateFollowUpEmail
  }
};

const getAIProviders = () => AI_PROVIDERS;

function AppContent() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('resume');
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    deepseek: '',
    gemini: '',
    selectedProviders: {
      openai: true,
      deepseek: true,
      gemini: true
    }
  });
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [documents, setDocuments] = useState(null);
  const [progress, setProgress] = useState({
    step: 0,
    message: '',
    provider: '',
    details: ''
  });
  const [showQuickApply, setShowQuickApply] = useState(false);
  const [currentJobDetails, setCurrentJobDetails] = useState(null);
  const [useSimpleJobInput, setUseSimpleJobInput] = useState(true);
  const [userWorkflow, setUserWorkflow] = useState({
    resumeUploaded: false,
    jobDetailsEntered: false,
    analysisComplete: false,
    documentsGenerated: false
  });
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(true);

  useEffect(() => {
    const savedKeys = localStorage.getItem('apiKeys');
    const savedProviders = localStorage.getItem('selectedProviders');
    if (savedKeys) {
      const parsedKeys = JSON.parse(savedKeys);
      setApiKeys(prev => ({
        ...parsedKeys,
        selectedProviders: savedProviders ? JSON.parse(savedProviders) : prev.selectedProviders
      }));
    }
  }, []);

  const handleApiKeysSet = (keys) => {
    setApiKeys(keys);
    localStorage.setItem('apiKeys', JSON.stringify(keys));
    localStorage.setItem('selectedProviders', JSON.stringify(keys.selectedProviders));
  };

  const handleResumeUpload = (text) => {
    setResume(text);
    setUserWorkflow(prev => ({...prev, resumeUploaded: true}));
    if (!userWorkflow.jobDetailsEntered) {
      setTimeout(() => {
        const jobDetailsElement = document.getElementById('job-details-section');
        if (jobDetailsElement) {
          jobDetailsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  };

  const updateProgress = (step, message, provider = '', details = '') => {
    setProgress({ step, message, provider, details });
  };

  const handleJobPostSubmit = async (jobPost) => {
    setJobDescription(jobPost);
    setError('');
    setLoading(true);
    setAnalysis(null);
    setDocuments(null);
    setCurrentJobDetails(jobPost);
    setUserWorkflow(prev => ({...prev, jobDetailsEntered: true}));
    setActiveTab('analysis');
    updateProgress(1, 'Starting analysis...', '', 'Initializing AI analysis');

    try {
      if (!resume) {
        throw new Error('Please upload your resume first');
      }
      
      // Debug information
      console.log('Job post details:', {
        description: jobPost.description ? jobPost.description.substring(0, 100) + '...' : 'No description',
        role: jobPost.role,
        company: jobPost.company,
        hasDescription: !!jobPost.description,
        descriptionLength: jobPost.description ? jobPost.description.length : 0,
        jobPostType: typeof jobPost
      });

      // Check if at least one provider is selected and has a valid key
      const hasValidProvider = Object.entries(apiKeys.selectedProviders).some(
        ([provider, isSelected]) => isSelected && apiKeys[provider]?.trim()
      );

      if (!hasValidProvider) {
        throw new Error('Please configure at least one AI provider with a valid API key');
      }

      const results = {
        openai: null,
        deepseek: null,
        gemini: null
      };

      // Helper function to ensure jobPost is a string
      const ensureString = (value) => {
        return typeof value === 'string' ? value : 
               (value && typeof value.toString === 'function') ? 
               value.toString() : '';
      };
      
      // Make sure we're passing the description string, not the whole object
      const jobDescription = typeof jobPost === 'object' && jobPost.description 
        ? jobPost.description 
        : ensureString(jobPost);
      
      console.log(`Sending job description to analysis APIs (${jobDescription.length} chars)`);

      // Try OpenAI if selected
      if (apiKeys.selectedProviders.openai && apiKeys.openai) {
        try {
          updateProgress(3, 'Analyzing with OpenAI...', 'OpenAI', 'Processing resume and job description');
          console.log('Attempting OpenAI analysis...');
          const openaiAnalysis = await openaiAnalyze(resume, jobDescription, apiKeys.openai);
          // Ensure percentages are in the correct format
          if (openaiAnalysis.overallFit <= 1) {
            openaiAnalysis.overallFit *= 100;
            openaiAnalysis.skillsMatch *= 100;
            openaiAnalysis.experienceRelevance *= 100;
            openaiAnalysis.educationAlignment *= 100;
          }
          results.openai = openaiAnalysis;
          updateProgress(4, 'OpenAI analysis complete', 'OpenAI', `Overall fit: ${Math.round(openaiAnalysis.overallFit)}%`);
        } catch (err) {
          console.error('OpenAI analysis failed:', err);
          updateProgress(4, 'OpenAI analysis failed', 'OpenAI', 'Error during analysis');
        }
      }

      // Try DeepSeek if selected
      if (apiKeys.selectedProviders.deepseek && apiKeys.deepseek) {
        try {
          updateProgress(4, 'Analyzing with DeepSeek...', 'DeepSeek', 'Processing resume and job description');
          console.log('Attempting DeepSeek analysis...');
          const deepseekAnalysis = await deepseekAnalyze(resume, jobDescription, apiKeys.deepseek);
          // Ensure percentages are in the correct format
          if (deepseekAnalysis.overallFit <= 1) {
            deepseekAnalysis.overallFit *= 100;
            deepseekAnalysis.skillsMatch *= 100;
            deepseekAnalysis.experienceRelevance *= 100;
            deepseekAnalysis.educationAlignment *= 100;
          }
          results.deepseek = deepseekAnalysis;
          updateProgress(5, 'DeepSeek analysis complete', 'DeepSeek', `Overall fit: ${Math.round(deepseekAnalysis.overallFit)}%`);
        } catch (err) {
          console.error('DeepSeek analysis failed:', err);
          updateProgress(5, 'DeepSeek analysis failed', 'DeepSeek', 'Error during analysis');
        }
      }

      // Try Gemini if selected
      if (apiKeys.selectedProviders.gemini && apiKeys.gemini) {
        try {
          updateProgress(6, 'Analyzing with Gemini...', 'Gemini', 'Processing resume and job description');
          console.log('Attempting Gemini analysis...');
          const geminiAnalysis = await geminiAnalyze(resume, jobDescription, apiKeys.gemini);
          // Ensure percentages are in the correct format
          if (geminiAnalysis.overallFit <= 1) {
            geminiAnalysis.overallFit *= 100;
            geminiAnalysis.skillsMatch *= 100;
            geminiAnalysis.experienceRelevance *= 100;
            geminiAnalysis.educationAlignment *= 100;
          }
          results.gemini = geminiAnalysis;
          updateProgress(7, 'Gemini analysis complete', 'Gemini', `Overall fit: ${Math.round(geminiAnalysis.overallFit)}%`);
        } catch (err) {
          console.error('Gemini analysis failed:', err);
          updateProgress(7, 'Gemini analysis failed', 'Gemini', 'Error during analysis');
        }
      }

      // Check if any analysis was successful
      const successfulAnalysis = Object.entries(results).filter(
        ([provider, result]) => 
          apiKeys.selectedProviders[provider] && 
          result && 
          !result.error
      );

      if (successfulAnalysis.length === 0) {
        const errorDetails = Object.entries(results)
          .filter(([provider, result]) => result?.error)
          .map(([provider, result]) => `${provider}: ${result.error}`)
          .join('\n');
        throw new Error(`All selected AI providers failed:\n${errorDetails}`);
      }

      setAnalysis(results);
      updateProgress(8, 'Analysis complete, generating documents...', '', 'Preparing to generate documents');

      try {
        // Ensure jobPost is properly handled
        const documents = {
          resume: {},
          coverLetter: {},
          followUpEmail: {},
          linkedinMessages: { default: true }, // Add linkedinMessages section with a default flag
          jobDetails: {
            company: extractCompanyName(jobPost),
            role: extractJobTitle(jobPost),
            location: extractJobLocation(jobPost),
            hiringManager: extractHiringManager(jobPost),
            description: typeof jobPost === 'string' ? jobPost : 
                       (jobPost && typeof jobPost.toString === 'function') ? 
                       jobPost.toString() : ''
          }
        };

        const generateFunctions = {
          openai: {
            resume: openaiGenerateResume,
            coverLetter: openaiGenerateCoverLetter,
            followUpEmail: openaiGenerateFollowUpEmail
          },
          deepseek: {
            resume: deepseekGenerateResume,
            coverLetter: deepseekGenerateCoverLetter,
            followUpEmail: deepseekGenerateFollowUpEmail
          },
          gemini: {
            resume: geminiGenerateResume,
            coverLetter: geminiGenerateCoverLetter,
            followUpEmail: geminiGenerateFollowUpEmail
          }
        };

        // Create an array of promises for all document generation tasks
        const documentGenerationPromises = [];
        const MAX_RETRIES = 2;

        // Helper function to retry failed API calls
        const retryableApiCall = async (fn, maxRetries = MAX_RETRIES) => {
          let lastError;
          for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
              if (attempt > 0) {
                console.log(`Retrying API call (attempt ${attempt}/${maxRetries})...`);
                // Add a small delay between retries (increasing with each attempt)
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              }
              return await fn();
            } catch (error) {
              console.error(`API call failed (attempt ${attempt}/${maxRetries}):`, error);
              lastError = error;
            }
          }
          throw lastError;
        };

        for (const [provider, analysis] of successfulAnalysis) {
          documentGenerationPromises.push(
            (async () => {
              try {
                updateProgress(9, `Generating documents with ${provider}...`, provider, 'Creating documents');
                
                const providerFunctions = generateFunctions[provider];
                
                // Generate resume with retry
                const optimizedResume = await retryableApiCall(async () => {
                  updateProgress(9, `Generating resume with ${provider}...`, provider, 'Creating optimized resume');
                  return await providerFunctions.resume(resume, ensureString(jobPost), analysis, apiKeys[provider]);
                });
                if (optimizedResume) {
                  documents.resume[provider] = optimizedResume;
                }
                
                // Generate cover letter with retry
                const coverLetter = await retryableApiCall(async () => {
                  updateProgress(9, `Generating cover letter with ${provider}...`, provider, 'Creating cover letter');
                  return await providerFunctions.coverLetter(resume, ensureString(jobPost), analysis, apiKeys[provider]);
                });
                if (coverLetter?.content) {
                  documents.coverLetter[provider] = coverLetter;
                }
                
                // Generate follow-up email with retry
                const followUpEmail = await retryableApiCall(async () => {
                  updateProgress(9, `Generating follow-up email with ${provider}...`, provider, 'Creating follow-up email');
                  return await providerFunctions.followUpEmail(resume, ensureString(jobPost), analysis, apiKeys[provider]);
                });
                if (followUpEmail?.content) {
                  documents.followUpEmail[provider] = followUpEmail;
                }
                
                updateProgress(10, `${provider} documents generated`, provider, 'Documents ready');
                return true;
              } catch (error) {
                console.error(`Error generating ${provider} documents:`, error);
                const errorMessage = error.response?.data?.error?.message || error.message;
                updateProgress(10, `${provider} document generation failed`, provider, `Error: ${errorMessage}`);
                return false;
              }
            })()
          );
        }

        // Wait for all document generation tasks to complete
        await Promise.allSettled(documentGenerationPromises);
        
        // Check if we have any successful document generations
        let hasAnyDocuments = false;
        Object.keys(documents).forEach(docType => {
          if (docType !== 'jobDetails' && docType !== 'linkedinMessages' && 
              Object.keys(documents[docType]).length > 0) {
            hasAnyDocuments = true;
          }
        });
        
        if (!hasAnyDocuments) {
          // If no documents were successfully generated, show a specific error
          setError("Unable to generate any documents. Please try again or try with a different AI provider.");
          updateProgress(11, 'Document generation incomplete', '', 'No documents were successfully generated');
        } else {
          // Set documents and move to documents tab
          setDocuments(documents);
          updateProgress(11, 'All documents generated successfully!', '', 'Documents ready for review');
          // Automatically navigate to documents tab after generation is complete
          setActiveTab('documents');
        }

        setUserWorkflow(prev => ({...prev, documentsGenerated: true}));
      } catch (error) {
        console.error('Error during document generation:', error);
        setError(`Document generation error: ${error.message}. Some documents may still be available.`);
        
        // Even in case of error, try to save any documents that were successfully generated
        if (documents && Object.keys(documents).some(key => Object.keys(documents[key]).length > 0)) {
          setDocuments(documents);
          setActiveTab('documents');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setUserWorkflow(prev => ({...prev, analysisComplete: true}));
    }
  };

  const handleQuickApplySubmit = (applicationData) => {
    try {
      // Get existing applications from localStorage
      const existingApplications = JSON.parse(localStorage.getItem('applications') || '[]');
      
      // Add the new application with a unique ID
      const newApplication = {
        ...applicationData,
        id: Date.now(),
        dateAdded: new Date().toISOString()
      };
      
      // Save updated applications list
      const updatedApplications = [...existingApplications, newApplication];
      localStorage.setItem('applications', JSON.stringify(updatedApplications));
      
      // Show success message
      setError(`Application for ${applicationData.role} at ${applicationData.company} successfully saved!`);
      
      // Update workflow state
      setUserWorkflow(prev => ({
        ...prev, 
        documentsGenerated: true
      }));
      
      // Close modal and switch to applications tab
      setShowQuickApply(false);
      setActiveTab('applications');
    } catch (error) {
      console.error('Error saving application:', error);
      setError(`Failed to save application: ${error.message}`);
    }
  };

  // Function to handle saving document changes
  const handleSaveDocumentChanges = (docType, provider, updatedContent) => {
    if (!documents) return;
    
    setDocuments(prevDocuments => ({
      ...prevDocuments,
      [docType]: {
        ...prevDocuments[docType],
        [provider]: updatedContent
      }
    }));
  };
  
  // Helper function to extract company name from job posting
  const extractCompanyName = (jobPost) => {
    // Simple extraction logic - could be enhanced with AI
    if (!jobPost) return '';
    
    // Ensure jobPost is a string before processing
    const jobPostStr = typeof jobPost === 'string' ? jobPost : 
                      (jobPost && typeof jobPost.toString === 'function') ? 
                      jobPost.toString() : '';
    
    if (jobPostStr === '') return '';
    
    // Look for common phrases that precede company names
    const companyPhrases = [
      'at ', 'with ', 'for ', 'join ', 'company: ', 'organization: '
    ];
    
    for (const phrase of companyPhrases) {
      const index = jobPostStr.toLowerCase().indexOf(phrase);
      if (index !== -1) {
        // Extract text after the phrase until a punctuation or line break
        const text = jobPostStr.slice(index + phrase.length);
        const match = text.match(/^([A-Za-z0-9\s\-&,.]+)/);
        if (match && match[1].trim().length > 0) {
          return match[1].trim();
        }
      }
    }
    
    return '';
  };
  
  // Helper function to extract job title from job posting
  const extractJobTitle = (jobPost) => {
    if (!jobPost) return '';
    
    // Ensure jobPost is a string before processing
    const jobPostStr = typeof jobPost === 'string' ? jobPost : 
                       (jobPost && typeof jobPost.toString === 'function') ? 
                       jobPost.toString() : '';
    
    if (jobPostStr === '') return '';
    
    // Look for common job title patterns
    const titlePatterns = [
      /job title:?\s*([A-Za-z0-9\s\-&,.]+)/i,
      /position:?\s*([A-Za-z0-9\s\-&,.]+)/i,
      /role:?\s*([A-Za-z0-9\s\-&,.]+)/i,
      /hiring\s+for:?\s*([A-Za-z0-9\s\-&,.]+)/i
    ];
    
    for (const pattern of titlePatterns) {
      const match = jobPostStr.match(pattern);
      if (match && match[1].trim().length > 0) {
        return match[1].trim();
      }
    }
    
    // If no explicit title found, check the first line as it often contains the job title
    const firstLine = jobPostStr.split('\n')[0].trim();
    if (firstLine && firstLine.length < 100) { // Reasonable length for a title
      return firstLine;
    }
    
    return '';
  };
  
  // Helper function to extract job location from job posting
  const extractJobLocation = (jobPost) => {
    if (!jobPost) return '';
    
    // Ensure jobPost is a string before processing
    const jobPostStr = typeof jobPost === 'string' ? jobPost : 
                       (jobPost && typeof jobPost.toString === 'function') ? 
                       jobPost.toString() : '';
    
    if (jobPostStr === '') return '';
    
    // Look for common location patterns
    const locationPatterns = [
      /location:?\s*([A-Za-z0-9\s\-&,.]+)/i,
      /based in:?\s*([A-Za-z0-9\s\-&,.]+)/i,
      /city:?\s*([A-Za-z0-9\s\-&,.]+)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = jobPostStr.match(pattern);
      if (match && match[1].trim().length > 0) {
        return match[1].trim();
      }
    }
    
    return '';
  };
  
  // Helper function to extract hiring manager from job posting
  const extractHiringManager = (jobPost) => {
    if (!jobPost) return '';
    
    // Ensure jobPost is a string before processing
    const jobPostStr = typeof jobPost === 'string' ? jobPost : 
                       (jobPost && typeof jobPost.toString === 'function') ? 
                       jobPost.toString() : '';
    
    if (jobPostStr === '') return '';
    
    // Look for hiring manager patterns
    const managerPatterns = [
      /hiring manager:?\s*([A-Za-z0-9\s\-&,.]+)/i,
      /report to:?\s*([A-Za-z0-9\s\-&,.]+)/i,
      /manager:?\s*([A-Za-z0-9\s\-&,.]+)/i
    ];
    
    for (const pattern of managerPatterns) {
      const match = jobPostStr.match(pattern);
      if (match && match[1].trim().length > 0) {
        return match[1].trim();
      }
    }
    
    return '';
  };

  // Define the application workflow steps
  const workflowSteps = [
    { id: 'resume', label: 'Resume Upload', complete: userWorkflow.resumeUploaded },
    { id: 'job', label: 'Job Details', complete: userWorkflow.jobDetailsEntered },
    { id: 'analysis', label: 'Resume Analysis', complete: userWorkflow.analysisComplete },
    { id: 'documents', label: 'Create Documents', complete: userWorkflow.documentsGenerated },
    { id: 'apply', label: 'Apply', complete: false }
  ];

  // Function to get background color for workflow step
  const getStepBackground = (step) => {
    if (step.complete) {
      return theme.isDarkMode ? 'rgba(74, 222, 128, 0.2)' : 'rgba(74, 222, 128, 0.1)';
    }
    if (step.id === activeTab) {
      return theme.isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)';
    }
    return 'transparent';
  };

  // Define the tabs for the application
  const tabs = [
    {
      id: 'resume',
      label: 'Resume & Setup',
      icon: '📄'
    },
    {
      id: 'analysis',
      label: 'ATS Analysis',
      icon: '🔍'
    },
    {
      id: 'documents',
      label: 'Generated Documents',
      icon: '📝'
    },
    {
      id: 'interview',
      label: 'Interview Simulator',
      icon: '🎙️'
    },
    {
      id: 'applications',
      label: 'Application Tracker',
      icon: '📊'
    },
    {
      id: 'daily',
      label: 'Daily Jobs',
      icon: '🌞'
    }
  ];

  return (
    <div 
      className="min-h-screen transition-colors"
      style={{ 
        backgroundColor: theme.colors.background,
        color: theme.colors.text.primary
      }}
    >
      <header 
        className="fixed top-0 w-full z-50 transition-colors"
        style={{ 
          backgroundColor: theme.colors.card,
          borderBottom: `1px solid ${theme.colors.border}`
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start">
              <h1 className="text-5xl font-black tracking-tighter relative">
                <span className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent" style={{
                  WebkitTextStroke: theme.isDarkMode ? '1px rgba(139, 92, 246, 0.1)' : 'none',
                  filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                }}>
                  W Boost
                </span>
                <span className="absolute -bottom-5 right-1 flex items-center">
                  <span className="text-sm font-medium px-3 py-1 rounded-full shadow-sm" style={{ 
                    background: 'linear-gradient(135deg, rgba(244, 114, 182, 0.2), rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2))',
                    border: `1px solid ${theme.isDarkMode ? 'rgba(167, 139, 250, 0.3)' : 'rgba(167, 139, 250, 0.4)'}`,
                    color: theme.isDarkMode ? 'rgba(196, 181, 253, 1)' : 'rgba(124, 58, 237, 1)',
                    textShadow: theme.isDarkMode ? '0 0 8px rgba(167, 139, 250, 0.3)' : 'none'
                  }}>your career</span>
                </span>
              </h1>
              
              <div className="mt-1 text-xs tracking-wide uppercase font-medium" style={{ 
                color: theme.isDarkMode ? 'rgba(196, 181, 253, 0.8)' : 'rgba(124, 58, 237, 0.7)',
                letterSpacing: "0.15em",
                textShadow: theme.isDarkMode ? '0 0 8px rgba(167, 139, 250, 0.2)' : 'none'
              }}>
                Created by JDH
              </div>
            </div>
            
            <div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-28 pb-16">
        {/* Workflow Progress Bar - only show when guide is enabled */}
        {showWorkflowGuide && (
          <div className="mb-8 rounded-xl p-5 animate-fadeIn shadow-sm" style={{ 
            backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
            border: `1px solid ${theme.isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(226, 232, 240, 0.8)'}`,
            backdropFilter: 'blur(8px)'
          }}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-lg" style={{ color: theme.colors.text.primary }}>
                Your Application Journey
              </h3>
              <button 
                onClick={() => setShowWorkflowGuide(false)}
                className="text-sm px-2 py-1 rounded-md transition-all hover:bg-opacity-80"
                style={{ 
                  backgroundColor: theme.isDarkMode ? 'rgba(55, 65, 81, 0.4)' : 'rgba(226, 232, 240, 0.7)',
                  color: theme.colors.text.secondary 
                }}
              >
                Hide
              </button>
            </div>
            <div className="flex items-center justify-between w-full">
              {workflowSteps.map((step, index) => (
                <React.Fragment key={step.id}>
                  {/* Step indicator */}
                  <div 
                    className="flex flex-col items-center cursor-pointer transition-all duration-200"
                    onClick={() => {
                      if ((step.id === 'resume') || 
                          (step.id === 'job' && userWorkflow.resumeUploaded) ||
                          (step.id === 'analysis' && userWorkflow.jobDetailsEntered) || 
                          (step.id === 'documents' && userWorkflow.analysisComplete)) {
                        setActiveTab(step.id);
                      }
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors"
                      style={{ 
                        backgroundColor: getStepBackground(step),
                        border: `2px solid ${
                          step.complete 
                            ? theme.colors.success 
                            : step.id === activeTab 
                              ? theme.colors.accent 
                              : theme.isDarkMode 
                                ? 'rgba(75, 85, 99, 0.5)' 
                                : 'rgba(209, 213, 219, 0.8)'
                        }`
                      }}
                    >
                      {step.complete ? (
                        <span role="img" aria-label="Complete">✓</span>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <span 
                      className="text-xs text-center"
                      style={{
                        color: step.id === activeTab ? theme.colors.accent : theme.colors.text.secondary,
                        fontWeight: step.id === activeTab ? '500' : '400'
                      }}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector line between steps (except after last step) */}
                  {index < workflowSteps.length - 1 && (
                    <div 
                      className="w-full h-0.5 flex-grow mx-1"
                      style={{ 
                        backgroundColor: index < workflowSteps.findIndex(s => s.id === activeTab) 
                          ? theme.colors.success 
                          : theme.isDarkMode 
                            ? 'rgba(75, 85, 99, 0.5)' 
                            : 'rgba(209, 213, 219, 0.8)'
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <nav 
            className="flex overflow-x-auto hide-scrollbar transition-colors rounded-xl p-2 snap-x"
            style={{ 
              backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.7)',
              borderBottom: `1px solid ${theme.colors.border}`,
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              backdropFilter: 'blur(8px)'
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 whitespace-nowrap snap-start ${
                  activeTab === tab.id 
                    ? 'scale-105' 
                    : 'hover:bg-opacity-50'
                }`}
                style={{
                  backgroundColor: activeTab === tab.id 
                    ? theme.isDarkMode ? 'rgba(79, 70, 229, 0.2)' : 'rgba(99, 102, 241, 0.1)'
                    : 'transparent',
                  color: activeTab === tab.id ? 
                    theme.isDarkMode ? 'rgba(167, 139, 250, 1)' : 'rgba(79, 70, 229, 1)' 
                    : theme.colors.text.secondary,
                  transform: activeTab === tab.id ? 'translateY(-2px)' : 'none',
                  boxShadow: activeTab === tab.id ? 
                    theme.isDarkMode ? '0 4px 8px rgba(0,0,0,0.25)' : '0 4px 8px rgba(0,0,0,0.1)' 
                    : 'none'
                }}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'analysis' && userWorkflow.analysisComplete && (
                  <span className="ml-1 flex h-2 w-2 rounded-full bg-green-500"></span>
                )}
                {tab.id === 'documents' && userWorkflow.documentsGenerated && (
                  <span className="ml-1 flex h-2 w-2 rounded-full bg-green-500"></span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {loading && (
          <div className="mb-8">
            <div 
              className="p-6 rounded-lg shadow-lg transition-colors animate-fadeIn"
              style={{ 
                backgroundColor: theme.colors.card, 
                boxShadow: `0 4px 6px -1px ${theme.isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`,
                border: `1px solid ${theme.isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.5)'}`
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
                         style={{ borderColor: `${theme.colors.accent} transparent transparent transparent` }} />
                  </div>
                  <span 
                    className="font-semibold text-lg"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {progress.message}
                  </span>
                </div>
                {progress.provider && (
                  <div 
                    className="flex items-center text-sm ml-1 pl-10 border-l-2"
                    style={{ 
                      color: theme.colors.text.secondary,
                      borderColor: theme.isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 0.8)'
                    }}
                  >
                    Using <span className="font-medium ml-1">{progress.provider}</span>
                  </div>
                )}
                {progress.details && (
                  <div 
                    className="text-sm ml-1 pl-10"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    {progress.details}
                  </div>
                )}
                <div className="mt-2">
                  <div 
                    className="w-full rounded-full h-3 overflow-hidden"
                    style={{ backgroundColor: theme.colors.progress.background }}
                  >
                    <div
                      className="h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ 
                        width: `${(progress.step / 11) * 100}%`,
                        backgroundColor: theme.colors.progress.fill,
                        boxShadow: `0 0 8px ${theme.colors.accent}`
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs" style={{ color: theme.colors.text.secondary }}>
                    <span>Analysis</span>
                    <span>{Math.round((progress.step / 11) * 100)}%</span>
                    <span>Documentation</span>
                  </div>
                  
                  {/* Show detailed document generation breakdown when relevant */}
                  {progress.step >= 9 && progress.step <= 10 && (
                    <div className="mt-4 space-y-2 pt-3 border-t" style={{ borderColor: theme.isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.5)' }}>
                      <div className="text-xs font-medium" style={{ color: theme.colors.text.secondary }}>Document Generation Progress:</div>
                      {Object.entries(apiKeys.selectedProviders)
                        .filter(([provider, isSelected]) => isSelected && apiKeys[provider])
                        .map(([provider]) => (
                          <div key={provider} className="text-xs flex items-center" style={{ color: theme.colors.text.secondary }}>
                            <span className="w-24">{provider.charAt(0).toUpperCase() + provider.slice(1)}:</span>
                            <div className="flex-1 ml-2">
                              <div className="flex items-center h-1.5 w-full rounded-full overflow-hidden" 
                                style={{ backgroundColor: theme.colors.progress.background }}>
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{ 
                                    width: progress.provider === provider ? '80%' : 
                                           progress.provider && progress.provider !== provider ? '100%' : '0%',
                                    backgroundColor: theme.colors.progress.fill 
                                  }}
                                />
                              </div>
                            </div>
                            <span className="ml-2">
                              {progress.provider === provider ? 
                                (progress.details?.includes('Creating') ? 'Generating...' : 'Processing...') : 
                                progress.provider && progress.provider !== provider ? 'Completed' : 'Waiting...'}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {activeTab === 'resume' && (
            <div className="space-y-8">
              <div 
                className="p-6 rounded-xl shadow-md transition-colors"
                style={{ 
                  backgroundColor: theme.colors.card,
                  border: `1px solid ${theme.isDarkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(226, 232, 240, 0.7)'}`,
                  boxShadow: theme.isDarkMode ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.05)'
                }}
              >
                <h2 
                  className="text-xl font-semibold mb-4"
                  style={{ color: theme.colors.text.primary }}
                >
                  AI Configuration
                </h2>
                <ApiKeyManager onApiKeysSet={handleApiKeysSet} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div 
                  className="p-6 rounded-xl shadow-md transition-colors"
                  style={{ 
                    backgroundColor: theme.colors.card,
                    border: `1px solid ${theme.isDarkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(226, 232, 240, 0.7)'}`,
                    boxShadow: theme.isDarkMode ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.05)'
                  }}
                >
                  <h2 
                    className="text-xl font-semibold mb-4"
                    style={{ color: theme.colors.text.primary }}
                  >
                    Upload Your Resume
                  </h2>
                  <ResumeUploader onResumeUpload={handleResumeUpload} />
                  
                  {/* Add a callout to the Daily Jobs feature */}
                  <div 
                    className="mt-6 p-4 rounded-lg border flex items-center gap-4 animate-fadeIn"
                    style={{ 
                      backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.7)',
                      borderColor: theme.isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.5)'
                    }}
                  >
                    <div className="text-2xl">🌞</div>
                    <div className="flex-1">
                      <h3 
                        className="font-medium"
                        style={{ color: theme.colors.text.primary }}
                      >
                        Looking for job opportunities?
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: theme.colors.text.secondary }}
                      >
                        Check out our daily curated job listings from Jobright.ai
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('daily')}
                      className="px-4 py-2.5 rounded-lg whitespace-nowrap transition-all hover:shadow-md"
                      style={{
                        backgroundColor: theme.colors.button.primary,
                        color: 'white'
                      }}
                    >
                      Browse Jobs
                    </button>
                  </div>
                </div>
                <div 
                  className="p-6 rounded-xl shadow-md transition-colors"
                  style={{ 
                    backgroundColor: theme.colors.card,
                    border: `1px solid ${theme.isDarkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(226, 232, 240, 0.7)'}`,
                    boxShadow: theme.isDarkMode ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.05)'
                  }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 
                      className="text-xl font-semibold"
                      style={{ color: theme.colors.text.primary }}
                    >
                      Job Details
                    </h2>
                    <div className="flex items-center space-x-2">
                      <span 
                        className="text-xs" 
                        style={{ color: theme.colors.text.secondary }}
                      >
                        Simple
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useSimpleJobInput}
                          onChange={() => setUseSimpleJobInput(!useSimpleJobInput)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                      <span 
                        className="text-xs" 
                        style={{ color: theme.colors.text.secondary }}
                      >
                        Advanced
                      </span>
                    </div>
                  </div>

                  {useSimpleJobInput ? (
                    <AIJobDetailsInput 
                      onSubmit={handleJobPostSubmit} 
                      apiKey={apiKeys.gemini} 
                    />
                  ) : (
                    <JobPostForm onSubmit={handleJobPostSubmit} />
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && analysis && (
            <div 
              className="p-6 rounded-xl shadow-md space-y-8 transition-colors"
              style={{ 
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.isDarkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(226, 232, 240, 0.7)'}`,
                boxShadow: theme.isDarkMode ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              <h2 
                className="text-xl font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                Resume Analysis Results
              </h2>
              <AnalysisResults 
                analysis={analysis} 
                selectedProviders={apiKeys.selectedProviders} 
              />
              <div className="flex flex-wrap justify-end gap-4 mt-6">
                <button
                  onClick={() => setActiveTab('documents')}
                  className="px-5 py-2.5 rounded-md transition-all duration-200 flex items-center gap-2 font-medium hover:scale-102 active:scale-98"
                  style={{
                    background: 'linear-gradient(135deg, rgb(236, 72, 153), rgb(124, 58, 237), rgb(99, 102, 241))',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)'
                  }}
                >
                  <span role="img" aria-label="Document">📝</span>
                  View Generated Documents
                </button>
                <button
                  onClick={() => setActiveTab('interview')}
                  className="px-5 py-2.5 rounded-md transition-all duration-200 flex items-center gap-2 font-medium hover:scale-102 active:scale-98"
                  style={{
                    backgroundColor: theme.isDarkMode ? 'rgba(45, 55, 72, 0.8)' : 'rgba(226, 232, 240, 0.8)',
                    color: theme.colors.text.primary,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    border: `1px solid ${theme.isDarkMode ? 'rgba(74, 85, 104, 0.4)' : 'rgba(203, 213, 225, 0.8)'}`
                  }}
                >
                  <span role="img" aria-label="Interview">🎤</span>
                  Start Interview Prep
                </button>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div 
              className="p-6 rounded-xl shadow-md space-y-8 transition-colors"
              style={{ 
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.isDarkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(226, 232, 240, 0.7)'}`,
                boxShadow: theme.isDarkMode ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              <h2 
                className="text-xl font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                Generated Documents
              </h2>
              {documents ? (
                <>
                  {error && error.includes("document generation") && (
                    <div className="p-4 rounded-md mb-4 animate-fadeIn"
                      style={{ 
                        backgroundColor: theme.isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(254, 226, 226, 0.8)',
                        border: `1px solid ${theme.isDarkMode ? 'rgba(220, 38, 38, 0.3)' : 'rgba(248, 113, 113, 0.4)'}`,
                        color: theme.isDarkMode ? 'rgba(252, 165, 165, 1)' : 'rgba(185, 28, 28, 1)'
                      }}
                    >
                      <div className="flex items-start">
                        <span role="img" aria-label="Warning" className="mr-2 text-lg">⚠️</span>
                        <div>
                          <p className="font-medium">Document Generation Warning</p>
                          <p className="text-sm mt-1">
                            {error.replace("Document generation error: ", "")}
                          </p>
                          <button 
                            className="text-xs mt-2 px-2 py-1 rounded"
                            style={{
                              backgroundColor: theme.isDarkMode ? 'rgba(220, 38, 38, 0.3)' : 'rgba(248, 113, 113, 0.2)',
                              border: `1px solid ${theme.isDarkMode ? 'rgba(220, 38, 38, 0.5)' : 'rgba(248, 113, 113, 0.4)'}`,
                            }}
                            onClick={() => setError("")}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <GeneratedDocuments documents={documents} onSaveChanges={handleSaveDocumentChanges} />
                </>
              ) : (
                <div 
                  className="text-center p-8"
                  style={{ color: theme.colors.text.secondary }}
                >
                  <p className="text-lg mb-4">
                    No documents have been generated yet. Please analyze a job posting first.
                  </p>
                  <button
                    onClick={() => setActiveTab('resume')}
                    className="px-5 py-2.5 rounded-md transition-all duration-200 flex items-center gap-2 font-medium hover:scale-102 active:scale-98 mx-auto"
                    style={{
                      backgroundColor: theme.colors.button.primary,
                      color: '#ffffff',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
                    }}
                  >
                    <span role="img" aria-label="Resume">📄</span>
                    Go to Resume & Setup
                  </button>
                </div>
              )}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setActiveTab('interview')}
                  className="px-5 py-2.5 rounded-md transition-all duration-200 flex items-center gap-2 font-medium hover:scale-102 active:scale-98"
                  style={{
                    backgroundColor: theme.colors.button.primary,
                    color: '#ffffff',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
                  }}
                >
                  <span role="img" aria-label="Interview">🎤</span>
                  Start Interview Prep
                </button>
                <button
                  onClick={() => setShowQuickApply(true)}
                  className="px-5 py-2.5 rounded-md transition-all duration-200 flex items-center gap-2 font-medium hover:scale-102 active:scale-98"
                  style={{
                    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(124, 58, 237, 0.1), rgba(99, 102, 241, 0.1))',
                    color: theme.isDarkMode ? 'rgba(196, 181, 253, 1)' : 'rgba(124, 58, 237, 1)',
                    boxShadow: '0 4px 8px rgba(139, 92, 246, 0.15)',
                    border: `1px solid ${theme.isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`
                  }}
                >
                  <span role="img" aria-label="Apply">📨</span>
                  Quick Apply
                </button>
              </div>
            </div>
          )}

          {activeTab === 'interview' && (
            <div 
              className="p-6 rounded-xl shadow-md space-y-8 transition-colors"
              style={{ 
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.isDarkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(226, 232, 240, 0.7)'}`,
                boxShadow: theme.isDarkMode ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              {resume && currentJobDetails ? (
                <InterviewSimulator
                  resume={resume}
                  jobDetails={currentJobDetails}
                  apiKey={apiKeys.gemini}
                  defaultProvider="gemini"
                />
              ) : (
                <div className="text-center p-8">
                  <p 
                    className="text-lg"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    Please upload your resume and analyze a job posting first to start the interview simulation.
                  </p>
                  <button
                    onClick={() => setActiveTab('resume')}
                    className="mt-4 px-4 py-2 rounded-md transition-colors"
                    style={{
                      backgroundColor: theme.colors.button.primary,
                      color: '#ffffff'
                    }}
                  >
                    Go to Resume & Setup
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div 
              className="p-6 rounded-xl shadow-md space-y-8 transition-colors"
              style={{ 
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.isDarkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(226, 232, 240, 0.7)'}`,
                boxShadow: theme.isDarkMode ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              <h2 
                className="text-xl font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                Application Tracker
              </h2>
              <ApplicationsTracker 
                selectedJob={currentJobDetails} // Pass the currently selected job
              />
              
              {/* Add job discovery banner */}
              <div 
                className="mt-6 p-4 rounded-lg border flex flex-col sm:flex-row items-center gap-4 animate-fadeIn"
                style={{ 
                  backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.7)',
                  borderColor: theme.isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.5)'
                }}
              >
                <div className="flex-1">
                  <h3 
                    className="font-medium text-center sm:text-left"
                    style={{ color: theme.colors.text.primary }}
                  >
                    Ready to add more applications? 🚀
                  </h3>
                  <p
                    className="text-sm text-center sm:text-left"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    Discover H1B sponsorship opportunities, new grad positions, and internships from our curated job listings.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('daily')}
                  className="px-4 py-2.5 rounded-lg whitespace-nowrap transition-all hover:shadow-md"
                  style={{
                    backgroundColor: theme.colors.button.primary,
                    color: 'white'
                  }}
                >
                  Explore New Opportunities
                </button>
              </div>
            </div>
          )}

          {activeTab === 'daily' && (
            <div 
              className="p-6 rounded-xl shadow-md space-y-8 transition-colors"
              style={{ 
                backgroundColor: theme.colors.card,
                border: `1px solid ${theme.isDarkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(226, 232, 240, 0.7)'}`,
                boxShadow: theme.isDarkMode ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              <h2 
                className="text-xl font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                Daily Jobs
              </h2>
              <DailyJobs 
                onJobSelect={(jobData) => {
                  // Update job description and current job details
                  setJobDescription(jobData.description);
                  setCurrentJobDetails(jobData);
                  
                  if (jobData.action === 'track') {
                    // Show a success message for tracking
                    setError(`Job "${jobData.role}" at "${jobData.company}" added to Application Tracker`);
                    // Move to applications tab
                    setActiveTab('applications');
                  } else {
                    // Show a success message for analysis
                    setError(`Job "${jobData.role}" at "${jobData.company}" selected for analysis`);
                    // Move to analysis tab to analyze the selected job
                    setActiveTab('analysis');
                    // Trigger job analysis after a short delay
                    setTimeout(() => {
                      handleJobPostSubmit(jobData);
                    }, 500);
                  }
                }}
              />
            </div>
          )}
        </div>

        {showQuickApply && currentJobDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div 
              className="p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors"
              style={{ backgroundColor: theme.colors.card }}
            >
              <QuickApplyForm
                jobDetails={currentJobDetails}
                onSubmit={handleQuickApplySubmit}
                onClose={() => setShowQuickApply(false)}
              />
            </div>
          </div>
        )}
      </main>

      <footer 
        className="mt-8 py-6 transition-colors"
        style={{ 
          borderTop: `1px solid ${theme.isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)'}`,
          backgroundColor: theme.isDarkMode ? 'rgba(17, 24, 39, 0.7)' : 'rgba(249, 250, 251, 0.8)',
          boxShadow: `0 -4px 12px ${theme.isDarkMode ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.03)'}`
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p 
              className="text-sm flex items-center gap-2"
              style={{ 
                color: theme.isDarkMode ? 'rgba(196, 181, 253, 0.8)' : 'rgba(124, 58, 237, 0.7)'
              }}
            >
              <span className="text-lg">💼</span>
              Made with passion by JDH
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/hernandezjuand" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm hover:underline flex items-center gap-1 transition-all hover:scale-105"
                style={{ 
                  color: theme.isDarkMode ? 'rgba(196, 181, 253, 0.8)' : 'rgba(124, 58, 237, 0.7)'
                }}
              >
                <span className="text-lg">📦</span>
                GitHub
              </a>
              <a 
                href="https://linkedin.com/in/hernandezjuand" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm hover:underline flex items-center gap-1 transition-all hover:scale-105"
                style={{ 
                  color: theme.isDarkMode ? 'rgba(196, 181, 253, 0.8)' : 'rgba(124, 58, 237, 0.7)'
                }}
              >
                <span className="text-lg">🔗</span>
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App; 