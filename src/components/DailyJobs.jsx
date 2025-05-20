import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const DailyJobs = ({ onJobSelect }) => {
  const theme = useTheme();
  const [jobsData, setJobsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");
  const [activeTab, setActiveTab] = useState("h1b");
  
  // Application Tracker state
  const [applications, setApplications] = useState(() => {
    const savedApplications = localStorage.getItem('jobApplications');
    return savedApplications ? JSON.parse(savedApplications) : [];
  });
  const [editingCell, setEditingCell] = useState(null); // For tracking which cell is being edited
  const [newApplication, setNewApplication] = useState({
    company: '',
    role: '',
    location: '',
    appliedDate: new Date().toISOString().split('T')[0],
    status: 'Applied',
    notes: '',
    link: ''
  });
  
  // Save applications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('jobApplications', JSON.stringify(applications));
  }, [applications]);
  
  // Filtering states
  const [filters, setFilters] = useState({
    company: '',
    role: '',
    level: '',
    location: '',
    h1bStatus: '',
    jobType: '',    // SWE, PM, Data
    roleType: ''    // New Grad, Internship
  });

  // Job category tabs configuration
  const tabs = [
    { 
      id: "h1b", 
      name: "H1B Jobs", 
      repos: [
        'https://raw.githubusercontent.com/jobright-ai/Daily-H1B-Jobs-In-Tech/refs/heads/master/README.md'
      ]
    },
    { 
      id: "new-grad-intern", 
      name: "New Grad & Internships",
      repos: [
        // Product Management
        'https://raw.githubusercontent.com/jobright-ai/2025-Product-Management-New-Grad/refs/heads/master/README.md',
        'https://raw.githubusercontent.com/jobright-ai/2025-Product-Management-Internship/refs/heads/master/README.md',
        // Data Analysis
        'https://raw.githubusercontent.com/jobright-ai/2025-Data-Analysis-New-Grad/refs/heads/master/README.md',
        'https://raw.githubusercontent.com/jobright-ai/2025-Data-Analysis-Internship/refs/heads/master/README.md',
        // Software Engineer
        'https://raw.githubusercontent.com/jobright-ai/2025-Software-Engineer-New-Grad/refs/heads/master/README.md',
        'https://raw.githubusercontent.com/jobright-ai/2025-Software-Engineering-Internship/refs/heads/master/README.md'
      ]
    }
  ];

  // Sample jobs for each category
  const sampleJobs = {
    "h1b": {
      company: "Vanguard",
      role: "Senior Fraud Data Scientist",
      level: "Senior",
      location: "Malvern, PA",
      h1bStatus: "🏅",
      linkText: "apply",
      linkUrl: "https://jobright.ai/jobs/info/example123",
      date: "2025-05-20",
    },
    "pm-new-grad": {
      company: "T-Mobile",
      role: "Associate Product Manager",
      level: "Entry-Level",
      location: "Bellevue, WA",
      h1bStatus: "",
      linkText: "apply",
      linkUrl: "https://jobright.ai/jobs/info/example456",
      date: "2025-05-19",
    },
    "pm-intern": {
      company: "Meta",
      role: "Product Management Intern",
      level: "Internship",
      location: "Menlo Park, CA",
      h1bStatus: "",
      linkText: "apply",
      linkUrl: "https://jobright.ai/jobs/info/example789",
      date: "2025-05-18",
    },
    "pm-exp": {
      company: "Amazon",
      role: "Senior Product Manager",
      level: "Senior",
      location: "Seattle, WA",
      h1bStatus: "",
      linkText: "apply",
      linkUrl: "https://jobright.ai/jobs/info/example101",
      date: "2025-05-17",
    },
    "data-new-grad": {
      company: "Google",
      role: "Data Analyst",
      level: "Entry-Level",
      location: "Mountain View, CA",
      h1bStatus: "",
      linkText: "apply",
      linkUrl: "https://jobright.ai/jobs/info/example102",
      date: "2025-05-16",
    },
    "data-intern": {
      company: "Microsoft",
      role: "Data Science Intern",
      level: "Internship",
      location: "Redmond, WA",
      h1bStatus: "",
      linkText: "apply",
      linkUrl: "https://jobright.ai/jobs/info/example103",
      date: "2025-05-15",
    },
    "data-exp": {
      company: "IBM",
      role: "Principal Data Scientist",
      level: "Senior",
      location: "New York, NY",
      h1bStatus: "",
      linkText: "apply",
      linkUrl: "https://jobright.ai/jobs/info/example104",
      date: "2025-05-14",
    },
    "swe-new-grad": {
      company: "Microsoft",
      role: "Software Engineer",
      level: "Entry-Level",
      location: "Redmond, WA",
      h1bStatus: "",
      linkText: "apply",
      linkUrl: "https://jobright.ai/jobs/info/example105",
      date: "2025-05-13",
    },
    "swe-intern": {
      company: "Apple",
      role: "Software Engineering Intern",
      level: "Internship",
      location: "Cupertino, CA",
      h1bStatus: "",
      linkText: "apply",
      linkUrl: "https://jobright.ai/jobs/info/example106",
      date: "2025-05-12",
    },
    "swe-exp": {
      company: "Netflix",
      role: "Senior Software Engineer",
      level: "Senior",
      location: "Los Gatos, CA",
      h1bStatus: "",
      linkText: "apply",
      linkUrl: "https://jobright.ai/jobs/info/example107",
      date: "2025-05-11",
    }
  };

  useEffect(() => {
    // When tab changes, reset state and fetch new data
    setLoading(true);
    setError(null);
    setDebugInfo("");
    setFilters({
      company: '',
      role: '',
      level: '',
      location: '',
      h1bStatus: '',
      jobType: '',
      roleType: ''
    });
    
    // Get the repositories for the active tab
    const activeTabConfig = tabs.find(tab => tab.id === activeTab);
    if (activeTabConfig) {
      if (activeTab === 'h1b') {
        // Simple case for H1B jobs - single repo list
        if (activeTabConfig.repos) {
          tryFetchUrls(activeTabConfig.repos);
        } else {
          setError("Repository configuration not found");
          setLoading(false);
        }
      } else if (activeTab === 'new-grad-intern') {
        // For new-grad-intern tab, fetch all repo groups and combine results
        fetchFromAllRepoGroups(activeTabConfig.repos);
      }
    } else {
      setError("Tab configuration not found");
      setLoading(false);
    }
  }, [activeTab]);

  // Extract unique values for dropdown filters
  const levelOptions = useMemo(() => {
    if (jobsData.length === 0) return ["Senior", "Mid-Level", "Entry-Level/Junior", "Internship"]; // Default
    
    const levels = [...new Set(jobsData.map(job => job.level).filter(Boolean))];
    return ["All", ...levels.sort()];
  }, [jobsData]);
  
  const locationOptions = useMemo(() => {
    if (jobsData.length === 0) return ["REMOTE", "New York, NY", "San Francisco, CA"]; // Default
    
    const locations = [...new Set(jobsData.map(job => job.location).filter(Boolean))];
    return ["All", ...locations.sort()];
  }, [jobsData]);
  
  const h1bStatusOptions = useMemo(() => {
    if (jobsData.length === 0) return ["🏅", "🥈", "🏆"]; // Default
    
    const statuses = [...new Set(jobsData.map(job => job.h1bStatus).filter(Boolean))];
    return ["All", ...statuses];
  }, [jobsData]);

  const jobTypeOptions = useMemo(() => {
    if (jobsData.length === 0) return ["PM", "Data", "SWE"]; // Default
    
    const types = [...new Set(jobsData.map(job => job.jobType).filter(Boolean))];
    return ["All", ...types.sort()];
  }, [jobsData]);
  
  const roleTypeOptions = useMemo(() => {
    if (jobsData.length === 0) return ["New Grad", "Internship"]; // Default
    
    const types = [...new Set(jobsData.map(job => job.roleType).filter(Boolean))];
    return ["All", ...types.sort()];
  }, [jobsData]);

  const tryFetchUrls = async (urls, index = 0) => {
    if (index >= urls.length) {
      setDebugInfo(prevInfo => prevInfo + "\nAll URLs failed. Using fallback data.");
      // Create a single sample job if we can't fetch
      setJobsData([{...sampleJobs[activeTab], id: `sample-${activeTab}`}]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(urls[index]);
      if (!response.ok) {
        setDebugInfo(prevInfo => prevInfo + `\nURL ${urls[index]} failed: ${response.status}`);
        tryFetchUrls(urls, index + 1);
        return;
      }
      
      const data = await response.text();
      setDebugInfo(prevInfo => prevInfo + `\nSuccessfully fetched from ${urls[index]}`);
      
      // Try parsing with detailed debug output
      const parsedJobs = parseMarkdownTable(data);
      
      if (parsedJobs.length > 0) {
        setDebugInfo(prevInfo => prevInfo + `\nSuccessfully parsed ${parsedJobs.length} jobs`);
        setJobsData(parsedJobs);
        setLoading(false);
      } else {
        setDebugInfo(prevInfo => prevInfo + "\nNo jobs found in data, trying alternate table pattern");
        
        // Try alternate parsing approach
        const altParsedJobs = parseAlternateMarkdownTable(data);
        
        if (altParsedJobs.length > 0) {
          setDebugInfo(prevInfo => prevInfo + `\nAlternate parsing found ${altParsedJobs.length} jobs`);
          setJobsData(altParsedJobs);
          setLoading(false);
        } else {
          setDebugInfo(prevInfo => prevInfo + "\nAlternate parsing failed. Trying next URL");
          tryFetchUrls(urls, index + 1);
        }
      }
    } catch (error) {
      setDebugInfo(prevInfo => prevInfo + `\nError with ${urls[index]}: ${error.message}`);
      tryFetchUrls(urls, index + 1);
    }
  };

  // More flexible alternate parsing approach
  const parseAlternateMarkdownTable = (markdown, jobType = '', roleType = '') => {
    const jobs = [];
    const lines = markdown.split('\n');
    
    // Look for lines that have job info
    const jobLines = lines.filter(line => 
      line.includes('|') && 
      line.includes('apply') && 
      line.includes('jobright.ai/jobs/info')
    );

    // Try to detect job type and role type from markdown content if not provided
    if (!jobType || !roleType) {
      const repoInfo = detectRepositoryInfo(markdown);
      jobType = jobType || repoInfo.jobType;
      roleType = roleType || repoInfo.roleType;
    }

    jobLines.forEach(line => {
      try {
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
        
        if (cells.length < 4) return;
        
        // Extract company name 
        let company = cells[0] || '';
        if (company.includes('**')) {
          company = company.replace(/\*\*/g, '');
        }
        if (company.includes('[')) {
          const match = company.match(/\[(.*?)\]/);
          if (match) company = match[1];
        }
        
        // Extract link data
        const linkCell = cells.find(cell => cell.includes('jobright.ai/jobs/info')) || '';
        const linkMatch = linkCell.match(/\[(.*?)\]\((.*?)\)/);
        
        let role = '';
        let level = '';
        let location = '';
        let h1bStatus = '';
        let date = '';
        let detectedJobType = jobType;
        let detectedRoleType = roleType;
        
        // Try to extract other fields based on position
        if (cells.length >= 5) {
          // Different repos might have different column orderings
          if (activeTab === 'h1b') {
            role = cells[1] || '';
            level = cells[2] || '';
            location = cells[3] || '';
            h1bStatus = cells[4] || '';
            if (cells.length >= 7) {
              date = cells[6] || '';
            }
          } else if (roleType === 'Internship' || activeTab.includes('intern')) {
            // For internship repos
            role = cells[1] || '';
            location = cells[2] || '';
            level = 'Internship';
            detectedRoleType = 'Internship';
            if (cells.length >= 5) {
              date = cells[4] || '';
            }
          } else if (roleType === 'New Grad' || activeTab.includes('new-grad')) {
            // For new grad repos
            role = cells[1] || '';
            location = cells[2] || '';
            level = 'Entry-Level';
            detectedRoleType = 'New Grad';
            if (cells.length >= 5) {
              date = cells[4] || '';
            }
          } else {
            // For experienced repos
            role = cells[1] || '';
            location = cells[2] || '';
            level = cells[3] || 'Experienced';
            if (cells.length >= 5) {
              date = cells[4] || '';
            }
          }
        }
        
        if (company && linkMatch) {
          jobs.push({
            company,
            role,
            level, 
            location,
            h1bStatus,
            linkText: linkMatch[1],
            linkUrl: linkMatch[2],
            date,
            jobType: detectedJobType,
            roleType: detectedRoleType,
            id: `${company}-${role}-${Math.random().toString(36).substring(2, 7)}`
          });
        }
      } catch (err) {
        console.error("Error parsing job line:", err);
      }
    });
    
    return jobs;
  };

  // Function to detect repository info from markdown content
  const detectRepositoryInfo = (markdown) => {
    const info = {
      jobType: 'Other',
      roleType: 'Other'
    };
    
    // Look for indicators in the markdown
    if (markdown.toLowerCase().includes('product management')) {
      info.jobType = 'PM';
    } else if (markdown.toLowerCase().includes('data analy')) {
      info.jobType = 'Data';
    } else if (markdown.toLowerCase().includes('software engineer')) {
      info.jobType = 'SWE';
    }
    
    if (markdown.toLowerCase().includes('new grad') || markdown.toLowerCase().includes('2025')) {
      info.roleType = 'New Grad';
    } else if (markdown.toLowerCase().includes('intern') || markdown.toLowerCase().includes('internship')) {
      info.roleType = 'Internship';
    }
    
    return info;
  };

  // Function to parse the markdown table
  const parseMarkdownTable = (markdown, jobType = '', roleType = '') => {
    const jobs = [];
    const lines = markdown.split('\n');
    
    // Try to detect job type and role type from markdown content if not provided
    if (!jobType || !roleType) {
      const repoInfo = detectRepositoryInfo(markdown);
      jobType = jobType || repoInfo.jobType;
      roleType = roleType || repoInfo.roleType;
    }
    
    // Different header patterns for different repositories
    let tableHeaderPatterns = [];
    
    if (activeTab === 'h1b') {
      tableHeaderPatterns = [
        line => line.includes('Company') && line.includes('Job Title') && line.includes('Level') && 
               line.includes('H1B') && line.includes('Link') && line.includes('Date')
      ];
    } else {
      // New grad, internship, and experienced repos have different headers
      tableHeaderPatterns = [
        line => line.includes('Company') && line.includes('Job Title') && line.includes('Location'),
        line => line.includes('Company') && line.includes('Location') && line.includes('Work Model'),
        line => line.includes('----- | --------- | --------- | ---- | -------')
      ];
    }
    
    // Find table header using any matching pattern
    let tableHeaderIndex = -1;
    for (const pattern of tableHeaderPatterns) {
      tableHeaderIndex = lines.findIndex(pattern);
      if (tableHeaderIndex !== -1) break;
    }
    
    setDebugInfo(prevInfo => prevInfo + `\nTable header index: ${tableHeaderIndex}`);
    
    if (tableHeaderIndex === -1) return [];
    
    // Skip the separator line (| --- | --- | etc)
    let currentCompany = null;
    
    // Start processing from the first data row
    for (let i = tableHeaderIndex + 2; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Stop if we've reached the end of the table or section
      if (!line || !line.includes('|') || line.startsWith('#') || line.startsWith('---')) {
        continue;
      }
      
      // Parse the cells
      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
      
      // Ensure we have enough data
      if (cells.length >= 3) {
        // Check if this is a continuation row (↳)
        const isCompanyContinuation = cells[0].includes('↳');
        
        let company = '';
        let role = '';
        let level = '';
        let location = '';
        let h1bStatus = '';
        let link = '';
        let linkUrl = '';
        let linkText = '';
        let date = '';
        let detectedJobType = jobType;
        let detectedRoleType = roleType;
        
        if (isCompanyContinuation && currentCompany) {
          company = currentCompany;
          
          // Different repo types have different column orders
          if (activeTab === 'h1b') {
            role = cells[1] || '';
            level = cells[2] || '';
            location = cells[3] || '';
            h1bStatus = cells[4] || '';
            link = cells[5] || '';
            date = cells[6] || '';
          } else if (roleType === 'Internship' || activeTab.includes('intern')) {
            // For internship repos
            role = cells[1] || '';
            location = cells[2] || '';
            level = 'Internship';
            detectedRoleType = 'Internship';
            link = cells.find(c => c.includes('jobright.ai/jobs/info')) || '';
            
            if (cells.length >= 5) {
              date = cells[4] || '';
            }
          } else if (roleType === 'New Grad' || activeTab.includes('new-grad')) {
            // For new grad repos
            role = cells[1] || '';
            location = cells[2] || '';
            level = 'Entry-Level';
            detectedRoleType = 'New Grad';
            link = cells.find(c => c.includes('jobright.ai/jobs/info')) || '';
            
            if (cells.length >= 5) {
              date = cells[4] || '';
            }
          } else {
            // For experienced repos
            role = cells[1] || '';
            location = cells[2] || '';
            level = cells[3] || 'Experienced';
            link = cells.find(c => c.includes('jobright.ai/jobs/info')) || '';
            
            if (cells.length >= 5) {
              date = cells[4] || '';
            }
          }
        } else {
          // Extract company name from markdown formatting
          const companyCell = cells[0];
          company = extractCompanyName(companyCell);
          currentCompany = company;
          
          // Different repo types have different column orders
          if (activeTab === 'h1b') {
            role = cells[1] || '';
            level = cells[2] || '';
            location = cells[3] || '';
            h1bStatus = cells[4] || '';
            link = cells[5] || '';
            date = cells[6] || '';
          } else if (roleType === 'Internship' || activeTab.includes('intern')) {
            // For internship repos
            role = cells[1] || '';
            location = cells[2] || '';
            level = 'Internship';
            detectedRoleType = 'Internship';
            
            // Find the cell containing a link to jobright
            link = cells.find(c => c.includes('jobright.ai/jobs/info')) || '';
            
            if (cells.length >= 5) {
              date = cells[4] || '';
            }
          } else if (roleType === 'New Grad' || activeTab.includes('new-grad')) {
            // For new grad repos
            role = cells[1] || '';
            location = cells[2] || '';
            level = 'Entry-Level';
            detectedRoleType = 'New Grad';
            
            // Find the cell containing a link to jobright
            link = cells.find(c => c.includes('jobright.ai/jobs/info')) || '';
            
            if (cells.length >= 5) {
              date = cells[4] || '';
            }
          } else {
            // For experienced repos
            role = cells[1] || '';
            location = cells[2] || '';
            level = cells[3] || 'Experienced';
            
            // Find the cell containing a link to jobright
            link = cells.find(c => c.includes('jobright.ai/jobs/info')) || '';
            
            if (cells.length >= 5) {
              date = cells[4] || '';
            }
          }
        }
        
        // Extract link URL from markdown formatting
        if (link && link.includes('[')) {
          const linkMatch = link.match(/\[(.*?)\]\((.*?)\)/);
          if (linkMatch) {
            linkText = linkMatch[1];
            linkUrl = linkMatch[2];
          }
        }
        
        // Get link from role column for new grad/intern repos if needed
        if (!linkUrl && role && role.includes('[')) {
          const roleMatch = role.match(/\[(.*?)\]\((.*?)\)/);
          if (roleMatch) {
            role = roleMatch[1];
            linkUrl = roleMatch[2];
            linkText = 'apply';
          }
        }
        
        // Only add if we have the minimum required data
        if ((company || role) && (linkUrl || link)) {
          jobs.push({
            company,
            role,
            level,
            location,
            h1bStatus,
            link,
            linkText: linkText || 'Apply',
            linkUrl,
            date,
            jobType: detectedJobType,
            roleType: detectedRoleType,
            id: `${company}-${role}-${Math.random().toString(36).substring(2, 7)}`
          });
        }
      }
    }
    
    return jobs;
  };

  // Helper function to extract company name from markdown formatting
  const extractCompanyName = (companyCell) => {
    let companyName = companyCell;
    
    // Try to extract from bold markdown links
    const boldLinkMatch = companyCell.match(/\*\*\[(.*?)\]/);
    if (boldLinkMatch && boldLinkMatch[1]) {
      companyName = boldLinkMatch[1];
    } else if (companyCell.includes('[') && companyCell.includes(']')) {
      // Try to extract from regular markdown links
      const linkMatch = companyCell.match(/\[(.*?)\]/);
      if (linkMatch && linkMatch[1]) {
        companyName = linkMatch[1];
      }
    } else {
      // Fallback cleanup for any other format
      companyName = companyCell
        .replace(/\*\*/g, '')  // Remove bold markers
        .replace(/\[|\]/g, '') // Remove brackets
        .replace(/\(http.*\)/g, ''); // Remove URLs
    }
    
    return companyName.trim();
  };

  const handleJobClick = (job, action = 'analyze') => {
    if (onJobSelect && typeof onJobSelect === 'function') {
      onJobSelect({
        company: job.company,
        role: job.role,
        location: job.location,
        link: job.linkUrl,
        description: `${job.role} at ${job.company}${job.location ? ` (${job.location})` : ''}`,
        datePosted: job.date,
        action: action // Add action parameter to indicate what to do with this job
      });
    }
  };

  const handleShowDebug = () => {
    alert(debugInfo || "No debug information available");
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };

  // Apply filters to jobs data - now matching by STARTS WITH
  const filteredJobs = jobsData.filter(job => {
    return (
      // Text inputs: match items that start with the filter text (case insensitive)
      (!filters.company || job.company?.toLowerCase().startsWith(filters.company.toLowerCase())) &&
      (!filters.role || job.role?.toLowerCase().startsWith(filters.role.toLowerCase())) &&
      
      // Dropdowns: exact match but ignore "All"
      (filters.level === "" || filters.level === "All" || job.level === filters.level) &&
      (filters.location === "" || filters.location === "All" || job.location === filters.location) &&
      (filters.h1bStatus === "" || filters.h1bStatus === "All" || job.h1bStatus === filters.h1bStatus) &&
      (filters.jobType === "" || filters.jobType === "All" || job.jobType === filters.jobType) &&
      (filters.roleType === "" || filters.roleType === "All" || job.roleType === filters.roleType)
    );
  });

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      company: '',
      role: '',
      level: '',
      location: '',
      h1bStatus: '',
      jobType: '',
      roleType: ''
    });
  };

  // Create filter input field
  const renderFilterInput = (field, placeholder) => {
    return (
      <input
        type="text"
        value={filters[field]}
        onChange={(e) => handleFilterChange(field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm rounded focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
        style={{
          backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
          color: theme.colors?.text?.primary,
          border: filters[field] 
            ? `1px solid ${theme.isDarkMode ? '#3B82F6' : '#2563EB'}`
            : `1px solid ${theme.colors?.border || '#e2e8f0'}`
        }}
      />
    );
  };

  // Create dropdown select field
  const renderFilterSelect = (field, options, placeholder) => {
    return (
      <select
        value={filters[field]}
        onChange={(e) => handleFilterChange(field, e.target.value)}
        className="w-full px-3 py-2 text-sm rounded focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none cursor-pointer"
        style={{
          backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
          color: theme.colors?.text?.primary,
          border: filters[field] && filters[field] !== "All"
            ? `1px solid ${theme.isDarkMode ? '#3B82F6' : '#2563EB'}`
            : `1px solid ${theme.colors?.border || '#e2e8f0'}`,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23${theme.isDarkMode ? '9ca3af' : '6b7280'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          backgroundSize: '1rem',
          paddingRight: '2.5rem'
        }}
      >
        <option value="All">{placeholder}</option>
        {options.map(option => (
          option !== "All" && <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  };

  // Render active filter chips
  const renderActiveFilters = () => {
    const activeFilterEntries = Object.entries(filters)
      .filter(([_, value]) => value && value !== "All");
    
    if (activeFilterEntries.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-2 mb-4">
        {activeFilterEntries.map(([key, value]) => (
          <div 
            key={key} 
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
            style={{
              backgroundColor: theme.isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(219, 234, 254, 0.8)',
              color: theme.isDarkMode ? '#93c5fd' : '#1d4ed8',
              border: `1px solid ${theme.isDarkMode ? '#93c5fd' : '#1d4ed8'}`
            }}
          >
            <span className="font-medium">{getFilterLabel(key)}:</span>
            <span>{value}</span>
            <button 
              onClick={() => handleFilterChange(key, '')}
              className="ml-1 hover:text-red-500 transition-colors"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={handleResetFilters}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
          style={{
            backgroundColor: theme.isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(254, 226, 226, 0.5)',
            color: theme.isDarkMode ? '#ef4444' : '#b91c1c',
            border: `1px solid ${theme.isDarkMode ? '#ef4444' : '#b91c1c'}`
          }}
        >
          <span>Clear All</span>
        </button>
      </div>
    );
  };
  
  // Helper to get human-readable filter labels
  const getFilterLabel = (field) => {
    const labels = {
      company: 'Company',
      role: 'Job Title',
      level: 'Level',
      location: 'Location',
      h1bStatus: 'H1B Status',
      jobType: 'Job Type',
      roleType: 'Role Type'
    };
    return labels[field] || field;
  };
  
  // Render filter section
  const renderFilterSection = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    return (
      <div className="mb-6">
        <div 
          className="flex justify-between items-center mb-2 cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="text-lg font-medium" style={{ color: theme.colors?.text?.primary }}>
              Filter Jobs {filteredJobs.length !== jobsData.length && `(${filteredJobs.length}/${jobsData.length})`}
            </h3>
          </div>
          <div 
            className="text-sm transition-transform"
            style={{ 
              transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              color: theme.colors?.text?.secondary
            }}
          >
            ▼
          </div>
        </div>
        
        {!isCollapsed && (
          <>
            <div 
              className="p-4 rounded"
              style={{ 
                backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.3)' : 'rgba(241, 245, 249, 0.5)',
                border: `1px solid ${theme.colors?.border || '#e2e8f0'}`
              }}
            >
              <div className="flex flex-wrap -mx-2">
                <div className="px-2 w-full md:w-1/3 mb-4">
                  <label className="block text-sm mb-1 font-medium" style={{ color: theme.colors?.text?.secondary }}>Company</label>
                  {renderFilterInput('company', 'Filter by company...')}
                </div>
                <div className="px-2 w-full md:w-1/3 mb-4">
                  <label className="block text-sm mb-1 font-medium" style={{ color: theme.colors?.text?.secondary }}>Job Title</label>
                  {renderFilterInput('role', 'Filter by title...')}
                </div>
                <div className="px-2 w-full md:w-1/3 mb-4">
                  <label className="block text-sm mb-1 font-medium" style={{ color: theme.colors?.text?.secondary }}>Level</label>
                  {renderFilterSelect('level', levelOptions, 'All Levels')}
                </div>
                <div className="px-2 w-full md:w-1/3 mb-4">
                  <label className="block text-sm mb-1 font-medium" style={{ color: theme.colors?.text?.secondary }}>Location</label>
                  {renderFilterSelect('location', locationOptions, 'All Locations')}
                </div>
                {activeTab === 'h1b' && (
                  <div className="px-2 w-full md:w-1/3 mb-4">
                    <label className="block text-sm mb-1 font-medium" style={{ color: theme.colors?.text?.secondary }}>H1B Status</label>
                    {renderFilterSelect('h1bStatus', h1bStatusOptions, 'All Statuses')}
                  </div>
                )}
                {activeTab === 'new-grad-intern' && (
                  <>
                    <div className="px-2 w-full md:w-1/3 mb-4">
                      <label className="block text-sm mb-1 font-medium" style={{ color: theme.colors?.text?.secondary }}>Job Type</label>
                      {renderFilterSelect('jobType', jobTypeOptions, 'All Job Types')}
                    </div>
                    <div className="px-2 w-full md:w-1/3 mb-4">
                      <label className="block text-sm mb-1 font-medium" style={{ color: theme.colors?.text?.secondary }}>Role Type</label>
                      {renderFilterSelect('roleType', roleTypeOptions, 'All Role Types')}
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded text-sm transition-colors"
                  style={{
                    backgroundColor: theme.isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(254, 226, 226, 0.5)',
                    color: theme.isDarkMode ? '#ef4444' : '#b91c1c',
                    border: `1px solid ${theme.isDarkMode ? '#ef4444' : '#b91c1c'}`
                  }}
                >
                  Reset Filters
                </button>
              </div>
            </div>
            
            {renderActiveFilters()}
          </>
        )}
      </div>
    );
  };

  // Function to fetch from all repo groups and combine results
  const fetchFromAllRepoGroups = async (repoGroups) => {
    setDebugInfo(prevInfo => prevInfo + "\nFetching from all repo groups");
    
    // Create an array to store all jobs
    let allJobs = [];
    // Keep track of pending fetches
    let pendingGroups = repoGroups.length;
    
    if (pendingGroups === 0) {
      setError("No repository groups found");
      setLoading(false);
      return;
    }
    
    // Iterate through each repo group
    for (const groupUrl of repoGroups) {
      try {
        // Try to fetch from this group
        let jobs = await fetchFromRepoGroup(groupUrl);
        
        if (jobs.length > 0) {
          // Extract job type and role type from URL
          const jobType = extractJobTypeFromUrl(groupUrl);
          const roleType = extractRoleTypeFromUrl(groupUrl);
          
          // Add metadata to each job
          jobs = jobs.map(job => ({
            ...job,
            jobType: jobType,
            roleType: roleType,
            // Generate a more unique ID
            id: `${jobType}-${roleType}-${job.company}-${job.role}-${Math.random().toString(36).substring(2, 7)}`
          }));
          
          allJobs = [...allJobs, ...jobs];
        }
      } catch (error) {
        console.error(`Error fetching from group ${groupUrl}:`, error);
        setDebugInfo(prevInfo => prevInfo + `\nError with group ${groupUrl}: ${error.message}`);
      } finally {
        pendingGroups--;
        
        // If all groups have been processed, update the state
        if (pendingGroups === 0) {
          if (allJobs.length > 0) {
            setJobsData(allJobs);
            setLoading(false);
          } else {
            // No jobs found in any repo
            setDebugInfo(prevInfo => prevInfo + "\nNo jobs found in any repo. Using fallback data.");
            // Create sample jobs if we couldn't fetch any
            setJobsData([
              {...sampleJobs["pm-new-grad"], id: `sample-pm-new-grad`, jobType: "PM", roleType: "New Grad"},
              {...sampleJobs["pm-intern"], id: `sample-pm-intern`, jobType: "PM", roleType: "Internship"},
              {...sampleJobs["data-new-grad"], id: `sample-data-new-grad`, jobType: "Data", roleType: "New Grad"},
              {...sampleJobs["data-intern"], id: `sample-data-intern`, jobType: "Data", roleType: "Internship"},
              {...sampleJobs["swe-new-grad"], id: `sample-swe-new-grad`, jobType: "SWE", roleType: "New Grad"},
              {...sampleJobs["swe-intern"], id: `sample-swe-intern`, jobType: "SWE", roleType: "Internship"}
            ]);
            setLoading(false);
          }
        }
      }
    }
  };
  
  // Function to fetch from a specific repo group
  const fetchFromRepoGroup = async (groupUrl) => {
    return new Promise((resolve) => {
      // Generate alternative URL formats in case the provided one fails
      const alternativeUrls = generateAlternativeUrls(groupUrl);
      
      const tryNextUrl = async (index = 0) => {
        if (index >= alternativeUrls.length) {
          setDebugInfo(prevInfo => prevInfo + `\nAll URLs for ${groupUrl} failed.`);
          resolve([]);
          return;
        }
        
        try {
          const currentUrl = alternativeUrls[index];
          const response = await fetch(currentUrl);
          if (!response.ok) {
            setDebugInfo(prevInfo => prevInfo + `\nURL ${currentUrl} failed: ${response.status}`);
            tryNextUrl(index + 1);
            return;
          }
          
          const data = await response.text();
          setDebugInfo(prevInfo => prevInfo + `\nSuccessfully fetched ${currentUrl}`);
          
          // Try parsing with detailed debug output
          const parsedJobs = parseMarkdownTable(data);
          
          if (parsedJobs.length > 0) {
            setDebugInfo(prevInfo => prevInfo + `\nSuccessfully parsed ${parsedJobs.length} jobs from ${currentUrl}`);
            resolve(parsedJobs);
          } else {
            setDebugInfo(prevInfo => prevInfo + `\nNo jobs found in ${currentUrl} data, trying alternate table pattern`);
            
            // Try alternate parsing approach
            const altParsedJobs = parseAlternateMarkdownTable(data);
            
            if (altParsedJobs.length > 0) {
              setDebugInfo(prevInfo => prevInfo + `\nAlternate parsing found ${altParsedJobs.length} jobs from ${currentUrl}`);
              resolve(altParsedJobs);
            } else {
              setDebugInfo(prevInfo => prevInfo + `\nAlternate parsing failed for ${currentUrl}. Trying next URL`);
              tryNextUrl(index + 1);
            }
          }
        } catch (error) {
          setDebugInfo(prevInfo => prevInfo + `\nError with URL ${alternativeUrls[index]}: ${error.message}`);
          tryNextUrl(index + 1);
        }
      };
      
      tryNextUrl(0);
    });
  };

  // Generate alternative URL formats for GitHub raw content
  const generateAlternativeUrls = (originalUrl) => {
    const urls = [originalUrl];
    
    // GitHub raw content can be accessed via different URL patterns
    // Remove "/refs/heads" from URL if present
    if (originalUrl.includes('/refs/heads/')) {
      urls.push(originalUrl.replace('/refs/heads/', '/'));
    }
    
    // Try with "main" branch if "master" is in the URL
    if (originalUrl.includes('/master/')) {
      urls.push(originalUrl.replace('/master/', '/main/'));
    }
    
    // Try with "master" branch if "main" is in the URL
    if (originalUrl.includes('/main/')) {
      urls.push(originalUrl.replace('/main/', '/master/'));
    }
    
    return [...new Set(urls)]; // Remove duplicates
  };

  // Helper functions to extract job type and role type from URL
  const extractJobTypeFromUrl = (url) => {
    if (url.includes('Software-Engineer')) return 'SWE';
    if (url.includes('Product-Management')) return 'PM';
    if (url.includes('Data-Analysis')) return 'Data';
    return 'Other';
  };

  const extractRoleTypeFromUrl = (url) => {
    if (url.includes('New-Grad')) return 'New Grad';
    if (url.includes('Internship')) return 'Internship';
    return 'Other';
  };

  // Application Tracker functions
  const addApplication = (jobData = null) => {
    const newApp = jobData ? {
      id: `app-${Date.now()}`,
      company: jobData.company || '',
      role: jobData.role || '',
      location: jobData.location || '',
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Applied',
      notes: '',
      link: jobData.link || ''
    } : {
      ...newApplication,
      id: `app-${Date.now()}`
    };
    
    setApplications([...applications, newApp]);
    
    // Reset the form
    setNewApplication({
      company: '',
      role: '',
      location: '',
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Applied',
      notes: '',
      link: ''
    });
  };
  
  const updateApplication = (id, field, value) => {
    setApplications(applications.map(app => 
      app.id === id ? { ...app, [field]: value } : app
    ));
  };
  
  const deleteApplication = (id) => {
    setApplications(applications.filter(app => app.id !== id));
  };
  
  const exportToCSV = () => {
    if (applications.length === 0) {
      alert('No applications to export');
      return;
    }
    
    // Headers for CSV file
    const headers = ['Company', 'Role', 'Location', 'Applied Date', 'Status', 'Notes', 'Link'];
    
    // Format data for CSV
    const csvData = applications.map(app => [
      app.company, 
      app.role, 
      app.location, 
      app.appliedDate, 
      app.status, 
      app.notes, 
      app.link
    ]);
    
    // Combine headers and data
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
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
  
  const handleNewApplicationChange = (field, value) => {
    setNewApplication({
      ...newApplication,
      [field]: value
    });
  };

  return (
    <div className="p-4">
      {/* Main tabs */}
      <div className="flex overflow-x-auto mb-4 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 mr-2 whitespace-nowrap rounded-t-md transition-colors ${
              activeTab === tab.id ? 'font-semibold' : ''
            }`}
            style={{
              backgroundColor: activeTab === tab.id 
                ? (theme.isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 1)') 
                : (theme.isDarkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.5)'),
              color: theme.colors?.text?.primary,
              borderBottom: activeTab === tab.id 
                ? `2px solid ${theme.colors?.accent || '#3B82F6'}` 
                : 'none'
            }}
          >
            {tab.name}
          </button>
        ))}
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold" style={{ color: theme.colors?.text?.primary }}>
          {tabs.find(tab => tab.id === activeTab)?.name || 'Job Listings'}
        </h2>
        
        {filteredJobs.length !== jobsData.length && (
          <button
            onClick={handleResetFilters}
            className="px-3 py-1 rounded text-sm"
            style={{
              backgroundColor: theme.isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(254, 226, 226, 0.5)',
              color: theme.isDarkMode ? '#ef4444' : '#b91c1c',
              border: `1px solid ${theme.isDarkMode ? '#ef4444' : '#b91c1c'}`
            }}
          >
            Clear Filters ({filteredJobs.length}/{jobsData.length})
          </button>
        )}
      </div>
      
      {renderFilterSection()}
      
      {activeTab === 'h1b' && !loading && !error && jobsData.length > 0 && (
        <div className="mb-6 p-4 rounded"
            style={{ 
              backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.3)' : 'rgba(241, 245, 249, 0.5)',
              border: `1px solid ${theme.colors?.border || '#e2e8f0'}`
            }}>
          <h2 className="text-xl font-bold mb-2" style={{ color: theme.colors?.text?.primary }}>
            Daily H1B Jobs in Tech by Jobright.ai
          </h2>
          
          <p className="mb-4" style={{ color: theme.colors?.text?.primary }}>
            This job repository provides daily updates and tracks the latest H1B sponsorship jobs in tech. 
            Currently, we focus on four job categories in the United States: 
            <strong>Software Engineer, Product Manager, Marketing, Arts & Design.</strong>
          </p>
          
          <div className="mb-4 p-3 rounded" style={{ 
            backgroundColor: theme.isDarkMode ? 'rgba(234, 179, 8, 0.1)' : 'rgba(254, 240, 138, 0.5)',
            border: `1px solid ${theme.isDarkMode ? 'rgba(234, 179, 8, 0.3)' : 'rgba(234, 179, 8, 0.5)'}`
          }}>
            <p className="font-medium" style={{ color: theme.isDarkMode ? 'rgb(234, 179, 8)' : 'rgb(161, 98, 7)' }}>
              ⚠️ Please note that our high-quality H1B positions are selected based on one of the following criteria:
            </p>
            <ul className="list-disc ml-6 mt-2" style={{ color: theme.colors?.text?.primary }}>
              <li>The job description explicitly states that the company sponsors H1B visas.</li>
              <li>The company has a history of sponsoring such roles in the past two years, indicating a significant likelihood of them sponsoring the newly posted positions.</li>
            </ul>
          </div>
          
          <div className="mb-4" style={{ color: theme.colors?.text?.primary }}>
            <p>H1B Status Indicators:</p>
            <ul className="list-disc ml-6 mt-1">
              <li><span className="font-bold">🏅</span>: H1B sponsorship is explicitly mentioned in this job description.</li>
              <li><span className="font-bold">🥈</span>: The company has sponsored positions of this category in the past three years.</li>
            </ul>
          </div>
          
          <p className="text-sm italic" style={{ color: theme.colors?.text?.secondary }}>
            While this repository includes a fraction of available H1B positions, for a comprehensive list of H1B jobs across various roles and more regions,
            we invite you to explore <a href="https://jobright.ai/?inviteCode=68723914&utm_source=1006" target="_blank" rel="noopener noreferrer" 
            className="text-blue-600 hover:underline dark:text-blue-400">jobright.ai</a>.
          </p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" 
               style={{ borderColor: theme.colors?.accent || '#3B82F6' }}></div>
        </div>
      ) : error ? (
        <div className="p-6 text-center rounded-lg"
          style={{ 
            backgroundColor: theme.isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(254, 226, 226, 0.5)',
            color: theme.isDarkMode ? '#ef4444' : '#b91c1c'
          }}>
          <p>{error}</p>
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded"
              style={{
                backgroundColor: theme.isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(254, 226, 226, 0.8)',
                color: theme.isDarkMode ? '#ef4444' : '#b91c1c',
                border: `1px solid ${theme.isDarkMode ? '#ef4444' : '#b91c1c'}`
              }}
            >
              Try Again
            </button>
            <button
              onClick={handleShowDebug}
              className="px-4 py-2 rounded"
              style={{
                backgroundColor: theme.isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(219, 234, 254, 0.8)',
                color: theme.isDarkMode ? '#93c5fd' : '#1d4ed8',
                border: `1px solid ${theme.isDarkMode ? '#93c5fd' : '#1d4ed8'}`
              }}
            >
              Show Debug Info
            </button>
          </div>
        </div>
      ) : jobsData.length === 0 ? (
        <div className="p-6 text-center rounded-lg"
          style={{ 
            backgroundColor: theme.isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(254, 226, 226, 0.5)',
            color: theme.isDarkMode ? '#ef4444' : '#b91c1c'
          }}>
          <p>No jobs found in the data</p>
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => {
                setJobsData([{...sampleJobs[activeTab], id: `sample-${activeTab}`}]);
              }}
              className="px-4 py-2 rounded"
              style={{
                backgroundColor: theme.isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(219, 234, 254, 0.8)',
                color: theme.isDarkMode ? '#93c5fd' : '#1d4ed8',
                border: `1px solid ${theme.isDarkMode ? '#93c5fd' : '#1d4ed8'}`
              }}
            >
              Load Sample Jobs
            </button>
            <button
              onClick={handleShowDebug}
              className="px-4 py-2 rounded"
              style={{
                backgroundColor: theme.isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(219, 234, 254, 0.8)',
                color: theme.isDarkMode ? '#93c5fd' : '#1d4ed8',
                border: `1px solid ${theme.isDarkMode ? '#93c5fd' : '#1d4ed8'}`
              }}
            >
              Show Debug Info
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm" style={{ color: theme.colors?.text?.secondary }}>
              {filteredJobs.length} of {jobsData.length} jobs shown
            </div>
            <button
              onClick={handleShowDebug}
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: theme.isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(219, 234, 254, 0.8)',
                color: theme.isDarkMode ? '#93c5fd' : '#1d4ed8',
                border: `1px solid ${theme.isDarkMode ? '#93c5fd' : '#1d4ed8'}`
              }}
            >
              Show Debug Info
            </button>
          </div>
          <table className="w-full table-auto">
            <thead>
              <tr style={{ backgroundColor: theme.isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.7)' }}>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Company</th>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Job Title</th>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Level</th>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Location</th>
                {activeTab === 'h1b' && (
                  <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>H1B Status</th>
                )}
                {activeTab === 'new-grad-intern' && (
                  <>
                    <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Job Type</th>
                    <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Role Type</th>
                  </>
                )}
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Apply</th>
                <th className="px-4 py-2 text-left" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.secondary }}>Date Posted</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job, index) => (
                <tr 
                  key={job.id} 
                  className="hover:bg-opacity-80 transition-colors"
                  style={{ 
                    backgroundColor: index % 2 === 0 
                      ? (theme.isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.7)') 
                      : (theme.isDarkMode ? 'rgba(30, 41, 59, 0.3)' : 'rgba(241, 245, 249, 0.5)')
                  }}
                >
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>{job.company}</td>
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>{job.role}</td>
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>{job.level}</td>
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>{job.location}</td>
                  {activeTab === 'h1b' && (
                    <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>{job.h1bStatus}</td>
                  )}
                  {activeTab === 'new-grad-intern' && (
                    <>
                      <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>{job.jobType}</td>
                      <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>{job.roleType}</td>
                    </>
                  )}
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border }}>
                    {job.linkUrl ? (
                      <a 
                        href={job.linkUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {job.linkText || 'Apply'}
                      </a>
                    ) : (
                      job.link
                    )}
                  </td>
                  <td className="px-4 py-2" style={{ borderColor: theme.colors?.border, color: theme.colors?.text?.primary }}>{job.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default DailyJobs;