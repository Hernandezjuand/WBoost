import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const QuickApplyForm = ({ jobDetails, onSubmit, onClose }) => {
  const theme = useTheme();
  const today = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
  
  const [formData, setFormData] = useState({
    apply: true,
    status: 'Applied',
    dateApplied: today,
    notes: '',
    resumeVersion: 'latest',
    resumeFile: '',
    coverLetterVersion: 'latest',
    coverLetterFile: '',
    followUp: false,
    followUpDate: '',
    interviewPrep: false,
    applicationMethod: 'website',
    reminders: true,
    trackInATS: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Create a complete application record
    onSubmit({
      ...jobDetails,
      ...formData,
      applicationDate: formData.dateApplied || today,
      keywords: jobDetails.keySkills ? jobDetails.keySkills.split(',').map(s => s.trim()) : [],
      submittedAt: new Date().toISOString()
    });
  };

  return (
    <div className="relative" style={{ color: theme.colors.text.primary }}>
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute right-0 top-0 p-2 rounded-full hover:bg-opacity-10 hover:bg-gray-500 transition-colors"
        aria-label="Close"
      >
        ✕
      </button>
      
      <div className="card mb-4">
        <div className="card-header mb-4">
          <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
            Quick Apply: {jobDetails.role} at {jobDetails.company}
          </h2>
          <p className="text-sm mt-1" style={{ color: theme.colors.text.secondary }}>
            Review and confirm your application details
          </p>
        </div>

        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-md" style={{ backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.7)' }}>
              <h3 className="font-medium mb-2">Job Details</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Company:</span> {jobDetails.company || 'Not specified'}</p>
                <p><span className="font-medium">Role:</span> {jobDetails.role || 'Not specified'}</p>
                <p><span className="font-medium">Location:</span> {jobDetails.location || 'Not specified'}</p>
                <p><span className="font-medium">Salary:</span> {jobDetails.salary || 'Not specified'}</p>
                <p><span className="font-medium">Industry:</span> {jobDetails.industry || 'Not specified'}</p>
                <p><span className="font-medium">Key Skills:</span> {jobDetails.keySkills || 'Not specified'}</p>
              </div>
            </div>

            <div className="p-4 rounded-md" style={{ backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.7)' }}>
              <h3 className="font-medium mb-2">Document Status</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Resume:</span> <span className="text-green-500">✓ Ready</span></p>
                <p><span className="font-medium">Cover Letter:</span> <span className="text-green-500">✓ Ready</span></p>
                <p><span className="font-medium">LinkedIn Message:</span> <span className="text-green-500">✓ Ready</span></p>
                <p>
                  <span className="font-medium">Job Link:</span> 
                  <a 
                    href={jobDetails.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 px-2 py-1 text-xs rounded"
                    style={{ backgroundColor: theme.colors.accent, color: '#ffffff' }}
                  >
                    Open Job Posting
                  </a>
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="apply"
                checked={formData.apply}
                onChange={(e) => setFormData(prev => ({ ...prev, apply: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="apply" className="font-medium">
                I'm ready to apply now
              </label>
            </div>

            {formData.apply && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Application Date
                    </label>
                    <input
                      type="date"
                      value={formData.dateApplied}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateApplied: e.target.value }))}
                      className="w-full px-3 py-2 rounded-md"
                      style={{ backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.7)' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Application Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 rounded-md"
                      style={{ backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.7)' }}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Offered">Offered</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Accepted">Accepted</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Resume Version
                    </label>
                    <select
                      value={formData.resumeVersion}
                      onChange={(e) => setFormData(prev => ({ ...prev, resumeVersion: e.target.value }))}
                      className="w-full px-3 py-2 rounded-md"
                      style={{ backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.7)' }}
                    >
                      <option value="latest">Latest Generated Version</option>
                      <option value="optimized">Job-Optimized Version</option>
                      <option value="custom">Custom Upload</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Cover Letter Version
                    </label>
                    <select
                      value={formData.coverLetterVersion}
                      onChange={(e) => setFormData(prev => ({ ...prev, coverLetterVersion: e.target.value }))}
                      className="w-full px-3 py-2 rounded-md"
                      style={{ backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.7)' }}
                    >
                      <option value="latest">Latest Generated Version</option>
                      <option value="custom">Custom Upload</option>
                      <option value="none">No Cover Letter</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Application Method
                    </label>
                    <select
                      value={formData.applicationMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, applicationMethod: e.target.value }))}
                      className="w-full px-3 py-2 rounded-md"
                      style={{ backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.7)' }}
                    >
                      <option value="website">Company Website</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="indeed">Indeed</option>
                      <option value="email">Direct Email</option>
                      <option value="referral">Internal Referral</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="followUp"
                        checked={formData.followUp}
                        onChange={(e) => setFormData(prev => ({ ...prev, followUp: e.target.checked }))}
                        className="rounded"
                      />
                      <label htmlFor="followUp" className="text-sm font-medium">
                        Schedule Follow-up
                      </label>
                    </div>

                    {formData.followUp && (
                      <div className="ml-6">
                        <label className="block text-sm font-medium mb-1">
                          Follow-up Date
                        </label>
                        <input
                          type="date"
                          value={formData.followUpDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                          className="w-full px-3 py-2 rounded-md"
                          style={{ backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.7)' }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="interviewPrep"
                      checked={formData.interviewPrep}
                      onChange={(e) => setFormData(prev => ({ ...prev, interviewPrep: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="interviewPrep" className="text-sm font-medium">
                      Prepare for Interview
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="trackInATS"
                      checked={formData.trackInATS}
                      onChange={(e) => setFormData(prev => ({ ...prev, trackInATS: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="trackInATS" className="text-sm font-medium">
                      Track in Application System
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md"
                    style={{ 
                      backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.7)',
                      minHeight: "100px" 
                    }}
                    placeholder="Add any additional notes or reminders about this application..."
                  />
                </div>
              </>
            )}

            <div className="flex space-x-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-md border transition-colors"
                style={{
                  backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.7)',
                  borderColor: theme.colors.border
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 rounded-md transition-colors font-medium"
                style={{
                  backgroundColor: theme.colors.accent,
                  color: '#ffffff'
                }}
              >
                {formData.apply ? 'Submit Application' : 'Save for Later'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuickApplyForm; 