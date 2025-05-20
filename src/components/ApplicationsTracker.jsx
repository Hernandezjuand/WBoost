import React, { useState, useEffect, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const ApplicationTracker = ({ selectedJob = null }) => {
  const theme = useTheme();
  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem('applications');
    return saved ? JSON.parse(saved) : [];
  });

  const [editingCell, setEditingCell] = useState(null);
  const editInputRef = useRef(null);

  const [newApplication, setNewApplication] = useState({
    company: selectedJob?.company || '',
    role: selectedJob?.role || '',
    dateApplied: new Date().toISOString().split('T')[0],
    location: selectedJob?.location || '',
    link: selectedJob?.link || '',
    saidSponsor: false,
    type: '',
    keywords: '',
    contact: '',
    salary: '',
    desired: '',
    status: 'Applied',
    resumeUpload: '',
    notes: ''
  });

  // Update form if a job is selected externally
  useEffect(() => {
    if (selectedJob) {
      setNewApplication({
        ...newApplication,
        company: selectedJob.company || '',
        role: selectedJob.role || '',
        location: selectedJob.location || '',
        link: selectedJob.link || '',
      });
    }
  }, [selectedJob]);

  useEffect(() => {
    localStorage.setItem('applications', JSON.stringify(applications));
  }, [applications]);

  // Focus input when editing a cell
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingCell]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newApplication.company && newApplication.role) {
      setApplications([...applications, { ...newApplication, id: Date.now() }]);
      setNewApplication({
        company: '',
        role: '',
        dateApplied: new Date().toISOString().split('T')[0],
        location: '',
        link: '',
        saidSponsor: false,
        type: '',
        keywords: '',
        contact: '',
        salary: '',
        desired: '',
        status: 'Applied',
        resumeUpload: '',
        notes: ''
      });
    }
  };

  const handleCellEdit = (id, field, value) => {
    setApplications(
      applications.map((app) =>
        app.id === id ? { ...app, [field]: value } : app
      )
    );
    setEditingCell(null);
  };

  const handleDelete = (id) => {
    setApplications(applications.filter((app) => app.id !== id));
  };

  const exportToCSV = () => {
    if (applications.length === 0) {
      alert('No applications to export');
      return;
    }
    
    // Headers for CSV file
    const headers = [
      'Date Applied', 
      'Said Sponsor?', 
      'Type', 
      'Company', 
      'Role', 
      'Location', 
      'Keywords', 
      'Contact', 
      'Salary', 
      'Link', 
      'Desired', 
      'Status', 
      'Resume Upload', 
      'Notes'
    ];
    
    // Format data for CSV
    const csvData = applications.map(app => [
      app.dateApplied || '', 
      app.saidSponsor ? 'TRUE' : 'FALSE',
      app.type || '',
      app.company || '', 
      app.role || '', 
      app.location || '',
      app.keywords || '',
      app.contact || '',
      app.salary || '',
      app.link || '',
      app.desired || '',
      app.status || '',
      app.resumeUpload || '',
      app.notes || ''
    ]);
    
    // Combine headers and data
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'job_applications.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusColors = {
    'Applied': theme.isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800',
    'Interviewing': theme.isDarkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800',
    'Offered': theme.isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800',
    'Rejected': theme.isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
  };

  // Render an editable cell
  const renderEditableCell = (app, field, currentValue) => {
    const isEditing = editingCell && editingCell.id === app.id && editingCell.field === field;
    
    if (isEditing) {
      if (field === 'status') {
        return (
          <select
            ref={editInputRef}
            value={currentValue}
            onChange={(e) => handleCellEdit(app.id, field, e.target.value)}
            onBlur={() => setEditingCell(null)}
            className="w-full px-2 py-1 text-sm bg-background border border-primary rounded focus:outline-none"
            style={{ 
              backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
              color: theme.colors?.text?.primary,
              border: `1px solid ${theme.isDarkMode ? '#3B82F6' : '#2563EB'}`
            }}
          >
            <option value="Applied">Applied</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Offered">Offered</option>
            <option value="Rejected">Rejected</option>
          </select>
        );
      } else if (field === 'dateApplied') {
        return (
          <input
            ref={editInputRef}
            type="date"
            value={currentValue || ''}
            onChange={(e) => handleCellEdit(app.id, field, e.target.value)}
            onBlur={() => setEditingCell(null)}
            className="w-full px-2 py-1 text-sm border border-primary rounded focus:outline-none"
            style={{ 
              backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
              color: theme.colors?.text?.primary,
              border: `1px solid ${theme.isDarkMode ? '#3B82F6' : '#2563EB'}`
            }}
          />
        );
      } else if (field === 'saidSponsor') {
        return (
          <select
            ref={editInputRef}
            value={currentValue === true ? "true" : "false"}
            onChange={(e) => handleCellEdit(app.id, field, e.target.value === "true")}
            onBlur={() => setEditingCell(null)}
            className="w-full px-2 py-1 text-sm border border-primary rounded focus:outline-none"
            style={{ 
              backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
              color: theme.colors?.text?.primary,
              border: `1px solid ${theme.isDarkMode ? '#3B82F6' : '#2563EB'}`
            }}
          >
            <option value="true">TRUE</option>
            <option value="false">FALSE</option>
          </select>
        );
      } else if (field === 'desired') {
        return (
          <select
            ref={editInputRef}
            value={currentValue || ''}
            onChange={(e) => handleCellEdit(app.id, field, e.target.value)}
            onBlur={() => setEditingCell(null)}
            className="w-full px-2 py-1 text-sm border border-primary rounded focus:outline-none"
            style={{ 
              backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
              color: theme.colors?.text?.primary,
              border: `1px solid ${theme.isDarkMode ? '#3B82F6' : '#2563EB'}`
            }}
          >
            <option value="">Select</option>
            <option value="★">★</option>
            <option value="★★">★★</option>
            <option value="★★★">★★★</option>
            <option value="★★★★">★★★★</option>
            <option value="★★★★★">★★★★★</option>
          </select>
        );
      } else if (field === 'notes') {
        return (
          <textarea
            ref={editInputRef}
            value={currentValue || ''}
            onChange={(e) => handleCellEdit(app.id, field, e.target.value)}
            onBlur={() => setEditingCell(null)}
            className="w-full px-2 py-1 text-sm border border-primary rounded focus:outline-none"
            style={{ 
              backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
              color: theme.colors?.text?.primary,
              border: `1px solid ${theme.isDarkMode ? '#3B82F6' : '#2563EB'}`
            }}
            rows={3}
          />
        );
      } else {
        return (
          <input
            ref={editInputRef}
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleCellEdit(app.id, field, e.target.value)}
            onBlur={() => setEditingCell(null)}
            className="w-full px-2 py-1 text-sm border border-primary rounded focus:outline-none"
            style={{ 
              backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
              color: theme.colors?.text?.primary,
              border: `1px solid ${theme.isDarkMode ? '#3B82F6' : '#2563EB'}`
            }}
          />
        );
      }
    }
    
    // Display value when not editing
    if (field === 'status') {
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[currentValue || 'Applied']}`}
          onClick={() => setEditingCell({ id: app.id, field })}
        >
          {currentValue || 'Applied'}
        </span>
      );
    } else if (field === 'link' && currentValue) {
      return (
        <a
          href={currentValue}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          View
        </a>
      );
    } else if (field === 'resumeUpload' && currentValue) {
      return (
        <a
          href={currentValue}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Resume
        </a>
      );
    } else if (field === 'dateApplied' && currentValue) {
      return (
        <span onClick={() => setEditingCell({ id: app.id, field })}>
          {new Date(currentValue).toLocaleDateString()}
        </span>
      );
    } else if (field === 'saidSponsor') {
      return (
        <span 
          onClick={() => setEditingCell({ id: app.id, field })}
          className="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 px-1 py-0.5 rounded"
        >
          {currentValue === true ? 'TRUE' : 'FALSE'}
        </span>
      );
    } else if (field === 'desired') {
      return (
        <span 
          onClick={() => setEditingCell({ id: app.id, field })}
          className="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 px-1 py-0.5 rounded text-yellow-500"
        >
          {currentValue || '-'}
        </span>
      );
    } else {
      return (
        <span 
          onClick={() => setEditingCell({ id: app.id, field })}
          className="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 px-1 py-0.5 rounded"
        >
          {currentValue || '-'}
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold" style={{ color: theme.colors?.text?.primary }}>
          Application Tracker
        </h2>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="px-3 py-1.5 text-sm rounded"
            style={{
              backgroundColor: theme.isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(219, 234, 254, 0.8)',
              color: theme.isDarkMode ? '#93c5fd' : '#1d4ed8',
              border: `1px solid ${theme.isDarkMode ? '#93c5fd' : '#1d4ed8'}`
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div 
        className="p-4 rounded"
        style={{ 
          backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.3)' : 'rgba(241, 245, 249, 0.5)',
          border: `1px solid ${theme.colors?.border || '#e2e8f0'}`
        }}
      >
        <h3 className="text-lg font-medium mb-3" style={{ color: theme.colors?.text?.primary }}>
          Add New Application
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors?.text?.secondary }}>
              Company*
            </label>
            <input
              type="text"
              value={newApplication.company}
              onChange={(e) => setNewApplication({ ...newApplication, company: e.target.value })}
              className="w-full px-3 py-2 rounded text-sm"
              style={{ 
                backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
                color: theme.colors?.text?.primary,
                border: `1px solid ${theme.colors?.border || '#e2e8f0'}`
              }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors?.text?.secondary }}>
              Role*
            </label>
            <input
              type="text"
              value={newApplication.role}
              onChange={(e) => setNewApplication({ ...newApplication, role: e.target.value })}
              className="w-full px-3 py-2 rounded text-sm"
              style={{ 
                backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
                color: theme.colors?.text?.primary,
                border: `1px solid ${theme.colors?.border || '#e2e8f0'}`
              }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors?.text?.secondary }}>
              Location
            </label>
            <input
              type="text"
              value={newApplication.location}
              onChange={(e) => setNewApplication({ ...newApplication, location: e.target.value })}
              className="w-full px-3 py-2 rounded text-sm"
              style={{ 
                backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
                color: theme.colors?.text?.primary,
                border: `1px solid ${theme.colors?.border || '#e2e8f0'}`
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors?.text?.secondary }}>
              Date Applied
            </label>
            <input
              type="date"
              value={newApplication.dateApplied}
              onChange={(e) => setNewApplication({ ...newApplication, dateApplied: e.target.value })}
              className="w-full px-3 py-2 rounded text-sm"
              style={{ 
                backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
                color: theme.colors?.text?.primary,
                border: `1px solid ${theme.colors?.border || '#e2e8f0'}`
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors?.text?.secondary }}>
              Said Sponsor?
            </label>
            <select
              value={newApplication.saidSponsor ? "true" : "false"}
              onChange={(e) => setNewApplication({ ...newApplication, saidSponsor: e.target.value === "true" })}
              className="w-full px-3 py-2 rounded text-sm"
              style={{ 
                backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
                color: theme.colors?.text?.primary,
                border: `1px solid ${theme.colors?.border || '#e2e8f0'}`
              }}
            >
              <option value="false">FALSE</option>
              <option value="true">TRUE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors?.text?.secondary }}>
              Type
            </label>
            <input
              type="text"
              value={newApplication.type}
              onChange={(e) => setNewApplication({ ...newApplication, type: e.target.value })}
              className="w-full px-3 py-2 rounded text-sm"
              style={{ 
                backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
                color: theme.colors?.text?.primary,
                border: `1px solid ${theme.colors?.border || '#e2e8f0'}`
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors?.text?.secondary }}>
              Keywords
            </label>
            <input
              type="text"
              value={newApplication.keywords}
              onChange={(e) => setNewApplication({ ...newApplication, keywords: e.target.value })}
              className="w-full px-3 py-2 rounded text-sm"
              style={{ 
                backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
                color: theme.colors?.text?.primary,
                border: `1px solid ${theme.colors?.border || '#e2e8f0'}`
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors?.text?.secondary }}>
              Contact
            </label>
            <input
              type="text"
              value={newApplication.contact}
              onChange={(e) => setNewApplication({ ...newApplication, contact: e.target.value })}
              className="w-full px-3 py-2 rounded text-sm"
              style={{ 
                backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
                color: theme.colors?.text?.primary,
                border: `1px solid ${theme.colors?.border || '#e2e8f0'}`
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors?.text?.secondary }}>
              Salary
            </label>
            <input
              type="text"
              value={newApplication.salary}
              onChange={(e) => setNewApplication({ ...newApplication, salary: e.target.value })}
              className="w-full px-3 py-2 rounded text-sm"
              style={{ 
                backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
                color: theme.colors?.text?.primary,
                border: `1px solid ${theme.colors?.border || '#e2e8f0'}`
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors?.text?.secondary }}>
              Job Link
            </label>
            <input
              type="url"
              value={newApplication.link}
              onChange={(e) => setNewApplication({ ...newApplication, link: e.target.value })}
              className="w-full px-3 py-2 rounded text-sm"
              style={{ 
                backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
                color: theme.colors?.text?.primary,
                border: `1px solid ${theme.colors?.border || '#e2e8f0'}`
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors?.text?.secondary }}>
              Desired
            </label>
            <select
              value={newApplication.desired}
              onChange={(e) => setNewApplication({ ...newApplication, desired: e.target.value })}
              className="w-full px-3 py-2 rounded text-sm"
              style={{ 
                backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
                color: theme.colors?.text?.primary,
                border: `1px solid ${theme.colors?.border || '#e2e8f0'}`
              }}
            >
              <option value="">Select</option>
              <option value="★">★</option>
              <option value="★★">★★</option>
              <option value="★★★">★★★</option>
              <option value="★★★★">★★★★</option>
              <option value="★★★★★">★★★★★</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors?.text?.secondary }}>
              Status
            </label>
            <select
              value={newApplication.status}
              onChange={(e) => setNewApplication({ ...newApplication, status: e.target.value })}
              className="w-full px-3 py-2 rounded text-sm"
              style={{ 
                backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
                color: theme.colors?.text?.primary,
                border: `1px solid ${theme.colors?.border || '#e2e8f0'}`
              }}
            >
              <option value="Applied">Applied</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Offered">Offered</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors?.text?.secondary }}>
              Resume Upload (URL)
            </label>
            <input
              type="url"
              value={newApplication.resumeUpload}
              onChange={(e) => setNewApplication({ ...newApplication, resumeUpload: e.target.value })}
              className="w-full px-3 py-2 rounded text-sm"
              style={{ 
                backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
                color: theme.colors?.text?.primary,
                border: `1px solid ${theme.colors?.border || '#e2e8f0'}`
              }}
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-1" style={{ color: theme.colors?.text?.secondary }}>
              Notes
            </label>
            <textarea
              value={newApplication.notes}
              onChange={(e) => setNewApplication({ ...newApplication, notes: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 rounded text-sm"
              style={{ 
                backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
                color: theme.colors?.text?.primary,
                border: `1px solid ${theme.colors?.border || '#e2e8f0'}`
              }}
            />
          </div>

          <div className="md:col-span-3 mt-2">
            <button
              type="submit"
              className="w-full px-4 py-2 rounded font-medium"
              style={{
                backgroundColor: theme.isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(219, 234, 254, 0.8)',
                color: theme.isDarkMode ? '#93c5fd' : '#1d4ed8',
                border: `1px solid ${theme.isDarkMode ? '#93c5fd' : '#1d4ed8'}`
              }}
            >
              Add Application
            </button>
          </div>
        </form>
      </div>

      {applications.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr style={{ backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.7)' }}>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Date Applied</th>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Said Sponsor?</th>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Type</th>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Company</th>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Role</th>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Location</th>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Keywords</th>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Contact</th>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Salary</th>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Link</th>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Desired</th>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Status</th>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Resume</th>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Notes</th>
                <th className="px-4 py-2 text-center" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app, index) => (
                <tr 
                  key={app.id}
                  className="hover:bg-opacity-80 transition-colors"
                  style={{ 
                    backgroundColor: index % 2 === 0 
                      ? (theme.isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.7)') 
                      : (theme.isDarkMode ? 'rgba(30, 41, 59, 0.3)' : 'rgba(241, 245, 249, 0.5)')
                  }}
                >
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>
                    {renderEditableCell(app, 'dateApplied', app.dateApplied)}
                  </td>
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>
                    {renderEditableCell(app, 'saidSponsor', app.saidSponsor)}
                  </td>
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>
                    {renderEditableCell(app, 'type', app.type)}
                  </td>
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>
                    {renderEditableCell(app, 'company', app.company)}
                  </td>
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>
                    {renderEditableCell(app, 'role', app.role)}
                  </td>
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>
                    {renderEditableCell(app, 'location', app.location)}
                  </td>
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>
                    {renderEditableCell(app, 'keywords', app.keywords)}
                  </td>
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>
                    {renderEditableCell(app, 'contact', app.contact)}
                  </td>
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>
                    {renderEditableCell(app, 'salary', app.salary)}
                  </td>
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>
                    {renderEditableCell(app, 'link', app.link)}
                  </td>
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>
                    {renderEditableCell(app, 'desired', app.desired)}
                  </td>
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>
                    {renderEditableCell(app, 'status', app.status)}
                  </td>
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>
                    {renderEditableCell(app, 'resumeUpload', app.resumeUpload)}
                  </td>
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>
                    {renderEditableCell(app, 'notes', app.notes)}
                  </td>
                  <td className="px-4 py-2 text-center" style={{ borderColor: theme.colors?.border }}>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="text-xs px-2 py-1 rounded hover:bg-red-500/20"
                      style={{
                        color: theme.isDarkMode ? '#ef4444' : '#b91c1c',
                        border: `1px solid ${theme.isDarkMode ? '#ef4444' : '#b91c1c'}`
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div 
          className="p-6 text-center rounded"
          style={{ 
            backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.3)' : 'rgba(241, 245, 249, 0.5)',
            color: theme.colors?.text?.secondary,
            border: `1px solid ${theme.colors?.border || '#e2e8f0'}`
          }}
        >
          <p>No applications tracked yet. Add your first application above.</p>
        </div>
      )}
    </div>
  );
};

export default ApplicationTracker; 