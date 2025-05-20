import React, { useState } from 'react';
import { extractJobDetails } from '../api/gemini';

function AIJobDetailsInput({ onSubmit, apiKey }) {
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Extract structured data from job description using Gemini AI
      const extractedDetails = await extractJobDetails(jobDescription, apiKey);
      
      // Combine AI-extracted details with the full job description
      const fullJobDetails = {
        ...extractedDetails,
        description: jobDescription,
        dateApplied: new Date().toISOString().slice(0, 10), // Default to today
        status: 'Applied', // Default status
        desired: '★★★' // Default rating
      };
      
      onSubmit(fullJobDetails);
    } catch (err) {
      console.error('Error extracting job details:', err);
      setError('Failed to analyze job details. Please try again or manually enter details.');
      
      // If AI extraction fails, still submit with the raw description
      onSubmit({
        description: jobDescription,
        dateApplied: new Date().toISOString().slice(0, 10),
        status: 'Applied',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold text-card-foreground">
          Job Description
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Simply paste the entire job posting below - AI will extract the important details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card-body space-y-4">
        <div>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full px-3 py-2 bg-muted rounded-md min-h-[300px]"
            placeholder="Paste the complete job description here..."
            required
          />
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">💡 <strong>Tip:</strong> For better results, make sure the job description includes:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Exact job title and company name</li>
            <li>Specific technical skills and qualifications required</li>
            <li>Years of experience needed</li>
            <li>Key responsibilities and deliverables</li>
            <li>Industry-specific requirements</li>
          </ul>
        </div>
        
        {error && (
          <div className="text-red-500 text-sm py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !jobDescription.trim()}
          className={`w-full px-4 py-2 rounded-md transition-colors flex items-center justify-center space-x-2 
            ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
        >
          {isLoading ? (
            <>
              <span>Analyzing Job Details...</span>
              <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-white rounded-full ml-2"></div>
            </>
          ) : (
            <>
              <span>Analyze Resume</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default AIJobDetailsInput; 