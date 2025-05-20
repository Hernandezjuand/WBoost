import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function ResumeInput({ onResumeSubmit }) {
  const [resume, setResume] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/pdf') {
      setIsLoading(true);
      setPdfFile(file);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setNumPages(pdf.numPages);

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join(' ');
          fullText += pageText + '\n';
        }

        setResume(fullText);
        onResumeSubmit(fullText);
      } catch (error) {
        console.error('Error extracting text from PDF:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [onResumeSubmit]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  const handleTextChange = (e) => {
    const text = e.target.value;
    setResume(text);
    onResumeSubmit(text);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold text-card-foreground">
          Resume Input
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your resume in PDF format or paste the text
        </p>
      </div>

      <div className="card-body space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          {isLoading ? (
            <div className="flex flex-col items-center justify-center">
              <div className="spinner w-8 h-8 mb-2" />
              <p className="text-sm text-muted-foreground">
                Processing PDF...
              </p>
            </div>
          ) : pdfFile ? (
            <div className="space-y-2">
              <p className="text-sm text-card-foreground">
                {pdfFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {numPages} page{numPages !== 1 ? 's' : ''}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPdfFile(null);
                  setNumPages(null);
                  setResume('');
                }}
                className="text-sm text-destructive hover:text-destructive/80"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <svg
                className="mx-auto h-12 w-12 text-muted-foreground"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-primary hover:text-primary/80">
                  Upload a PDF
                </span>{' '}
                or drag and drop
              </div>
              <p className="text-xs text-muted-foreground">
                PDF up to 10MB
              </p>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="resume"
            className="block text-sm font-medium text-card-foreground mb-2"
          >
            Resume Text
          </label>
          <textarea
            id="resume"
            value={resume}
            onChange={handleTextChange}
            className="w-full h-48 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            placeholder="Paste your resume text here..."
          />
        </div>
      </div>
    </div>
  );
}

export default ResumeInput; 