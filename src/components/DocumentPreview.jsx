import React, { useState, useEffect } from 'react';
import ModernCVRenderer from './ModernCVRenderer';
import CVGenerator from './CVGenerator';

const DocumentPreview = ({ content, type, provider }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determine if this is structured JSON data for a CV
  const isJsonData = content && typeof content === 'object';
  
  // For backward compatibility, check if this is LaTeX content
  const isLatexCV = typeof content === 'string' && content && (
    content.includes('\\documentclass') && 
    (content.includes('moderncv') || 
     content.includes('\\cventry') || 
     content.includes('\\section'))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2 text-gray-600">Generating preview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p className="font-medium">Error generating preview:</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="p-4 bg-gray-50 text-gray-700 rounded-md">
        <p>No content available to preview.</p>
      </div>
    );
  }

  // If it's JSON data, use the CVGenerator component
  if (isJsonData) {
    return (
      <CVGenerator 
        personalInfo={content.personalInfo}
        education={content.education}
        skills={content.skills}
        experience={content.experience}
        otherSections={content.otherSections}
      />
    );
  }

  // For old LaTeX content, use the ModernCVRenderer (for backward compatibility)
  if (isLatexCV) {
    return (
      <ModernCVRenderer 
        content={content} 
        title={`${type} Preview - ${provider}`}
      />
    );
  }

  // For other content (like plain text cover letters or emails), show a simple preview
  return (
    <div className="w-full h-[600px] border rounded-lg overflow-hidden bg-white">
      <div className="p-8">
        <h2 className="text-xl font-bold mb-4">{type} - {provider}</h2>
        <div className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded h-[500px] overflow-auto">
          {content}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview; 