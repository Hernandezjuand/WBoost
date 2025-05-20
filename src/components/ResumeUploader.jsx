import React, { useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const ResumeUploader = ({ onResumeUpload }) => {
  const [resumeText, setResumeText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTextChange = (e) => {
    const text = e.target.value;
    setResumeText(text);
    onResumeUpload(text);
  };

  const extractTextFromPDF = async (file) => {
    try {
      setIsLoading(true);
      setError('');

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        fullText += pageText + '\n\n';
      }

      return fullText.trim();
    } catch (err) {
      console.error('Error parsing PDF:', err);
      throw new Error('Failed to parse PDF file. Please make sure it is a valid PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  const convertToLatex = (text) => {
    // Basic LaTeX template
    const latexTemplate = `\\documentclass[10pt,a4paper,sans]{moderncv}

% ModernCV theme
\\moderncvstyle{banking} % Style options: banking, casual, classic, oldstyle, fancy
\\moderncvcolor{blue}    % Color options: blue, orange, green, red, purple, grey, black

% Packages and Margins
\\usepackage[scale=0.80]{geometry}
\\setlength{\\itemsep}{-2pt} % Tightens spacing in itemize

% Font and Section Adjustments
\\renewcommand{\\sectionfont}{\\fontsize{12}{15}\\selectfont}

% Personal Data
\\name{}{}
\\address{}{}
\\phone[mobile]{}
\\email{}
\\social[linkedin]{}

% Begin Document
\\begin{document}

% Title
\\makecvtitle

% Content will be inserted here
${text}

\\end{document}`;

    return latexTemplate;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError('');

      let text;
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
        // Convert to LaTeX format
        text = convertToLatex(text);
      } else {
        text = await file.text();
      }

      setResumeText(text);
      onResumeUpload(text);
    } catch (err) {
      console.error('Error reading file:', err);
      setError(err.message || 'Failed to read file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError('');

      let text;
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
        // Convert to LaTeX format
        text = convertToLatex(text);
      } else {
        text = await file.text();
      }

      setResumeText(text);
      onResumeUpload(text);
    } catch (err) {
      console.error('Error reading file:', err);
      setError(err.message || 'Failed to read file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="card-header">
        <h2 className="text-xl font-semibold text-card-foreground">
          Resume Upload
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your resume or paste its contents
        </p>
      </div>

      <div className="card-body space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".txt,.doc,.docx,.pdf"
            onChange={handleFileUpload}
            className="hidden"
            id="resume-file"
          />
          <label
            htmlFor="resume-file"
            className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            )}
            {isLoading ? 'Processing...' : 'Upload Resume'}
          </label>
          <p className="text-sm text-muted-foreground mt-2">
            or drag and drop your resume file here
          </p>
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="resume-text"
            className="text-sm font-medium text-card-foreground"
          >
            Or paste your resume text here:
          </label>
          <textarea
            id="resume-text"
            value={resumeText}
            onChange={handleTextChange}
            placeholder="Paste your resume content here..."
            className="w-full h-48 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default ResumeUploader; 