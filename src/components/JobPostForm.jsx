import React, { useState } from 'react';

const JobPostForm = ({ onSubmit }) => {
  const [jobPost, setJobPost] = useState('');
  const [jobDetails, setJobDetails] = useState({
    dateApplied: '',
    isSponsor: false,
    type: '',
    company: '',
    role: '',
    location: '',
    keywords: '',
    contact: '',
    salary: '',
    link: '',
    desired: '',
    status: '',
    resumeLink: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jobPost.trim()) return;
    
    // Combine job post with additional details
    const fullJobDetails = {
      ...jobDetails,
      description: jobPost
    };
    
    onSubmit(fullJobDetails);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setJobDetails(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePrefill = () => {
    setJobDetails({
      dateApplied: '1/30/2025',
      isSponsor: true,
      type: 'Acceleration Program',
      company: 'Microsoft',
      role: 'Software Engineer 2',
      location: 'Cambridge',
      keywords: '',
      contact: 'N/A',
      salary: 'USD $98,300 - $193,200 Year',
      link: 'https://jobs.careers.microsoft.com/global/en/job/1804287/Software-Engineer-2%3A-Microsoft-AI-Development-Acceleration-Program%2C-Cambridge',
      desired: '★★★★★',
      status: 'Rejected',
      resumeLink: 'https://drive.google.com/file/d/1rV60zxtalqStmR9pnuBCtZ-tKTb35QVs/',
      notes: ''
    });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold text-card-foreground">
          Job Description
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter job details and paste the job description to analyze and generate tailored documents
        </p>
      </div>

      <div className="card-body">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Date Applied
              </label>
              <input
                type="date"
                name="dateApplied"
                value={jobDetails.dateApplied}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-muted rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Company
              </label>
              <input
                type="text"
                name="company"
                value={jobDetails.company}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-muted rounded-md"
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Role
              </label>
              <input
                type="text"
                name="role"
                value={jobDetails.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-muted rounded-md"
                placeholder="Job title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={jobDetails.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-muted rounded-md"
                placeholder="Job location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Salary Range
              </label>
              <input
                type="text"
                name="salary"
                value={jobDetails.salary}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-muted rounded-md"
                placeholder="Salary range"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Job Link
              </label>
              <input
                type="url"
                name="link"
                value={jobDetails.link}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-muted rounded-md"
                placeholder="Job posting URL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Status
              </label>
              <select
                name="status"
                value={jobDetails.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-muted rounded-md"
              >
                <option value="">Select status</option>
                <option value="Applied">Applied</option>
                <option value="Interviewing">Interviewing</option>
                <option value="Offered">Offered</option>
                <option value="Rejected">Rejected</option>
                <option value="Accepted">Accepted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Desired Rating
              </label>
              <select
                name="desired"
                value={jobDetails.desired}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-muted rounded-md"
              >
                <option value="">Select rating</option>
                <option value="★">★</option>
                <option value="★★">★★</option>
                <option value="★★★">★★★</option>
                <option value="★★★★">★★★★</option>
                <option value="★★★★★">★★★★★</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isSponsor"
              checked={jobDetails.isSponsor}
              onChange={handleInputChange}
              className="rounded border-gray-300"
            />
            <label className="text-sm text-card-foreground">
              Sponsors visa/work authorization
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Job Description
            </label>
            <textarea
              value={jobPost}
              onChange={(e) => setJobPost(e.target.value)}
              className="w-full px-3 py-2 bg-muted rounded-md min-h-[200px]"
              placeholder="Paste the job description here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={jobDetails.notes}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-muted rounded-md min-h-[100px]"
              placeholder="Add any additional notes..."
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handlePrefill}
              className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
            >
              Prefill Example
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
            >
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
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobPostForm; 