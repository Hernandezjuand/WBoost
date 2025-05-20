import React, { useState } from 'react';

function JobPostInput({ onJobPostSubmit }) {
  const [jobDescription, setJobDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onJobPostSubmit(jobDescription);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold text-card-foreground">
          Job Description
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Paste the job description to generate tailored documents
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card-body space-y-4">
        <div>
          <label
            htmlFor="jobDescription"
            className="block text-sm font-medium text-card-foreground mb-2"
          >
            Job Description
          </label>
          <textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full h-48 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            placeholder="Paste the job description here..."
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
        >
          Generate Documents
        </button>
      </form>
    </div>
  );
}

export default JobPostInput; 