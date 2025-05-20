export const analyzeResumeFit = async (resume, jobPost) => {
  // Simulate API call
  return {
    overallFit: 82,
    matchPercentages: {
      skills: 85,
      experience: 78,
      education: 83
    },
    recommendations: [
      'Highlight relevant experience',
      'Emphasize key skills',
      'Add more technical details'
    ]
  };
};

export const generateResume = async (resume, jobPost, analysis) => {
  return {
    original: resume,
    improved: resume + '\n\nAdded relevant keywords and restructured content'
  };
};

export const generateCoverLetter = async (resume, jobPost, analysis) => {
  return {
    content: 'Dear Hiring Manager,\n\nI am writing to express my interest...',
    improvements: [
      'Personalized introduction',
      'Highlighted relevant experience',
      'Added specific examples'
    ]
  };
};

export const generateFollowUpEmail = async (resume, jobPost, analysis) => {
  return {
    content: 'Dear [Hiring Manager],\n\nThank you for the interview opportunity...',
    improvements: [
      'Added specific interview details',
      'Included follow-up questions',
      'Expressed continued interest'
    ]
  };
}; 