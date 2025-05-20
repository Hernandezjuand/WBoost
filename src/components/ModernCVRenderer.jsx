import React, { useState, useEffect, useRef } from 'react';

const ModernCVRenderer = ({ content, title, onPrint }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [parsedCV, setParsedCV] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    const parseAndRenderCV = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!content) {
          throw new Error('No content provided');
        }

        // Parse the CV content
        const cvData = parseLatexCV(content);
        setParsedCV(cvData);
        
        // Render the CV content in the iframe after state update
        setTimeout(() => {
          renderCVToIframe(cvData);
          setLoading(false);
        }, 100);
      } catch (err) {
        console.error('CV Parsing Error:', err);
        setError(err.message || 'Failed to parse CV');
        setLoading(false);
      }
    };

    parseAndRenderCV();
  }, [content]);

  // Function to parse LaTeX CV content
  const parseLatexCV = (content) => {
    const cvData = {
      personalInfo: {},
      sections: []
    };

    // Extract personal info
    const nameMatch = content.match(/\\name\{([^}]+)\}\{([^}]+)\}/);
    if (nameMatch) {
      cvData.personalInfo.firstName = nameMatch[1];
      cvData.personalInfo.lastName = nameMatch[2];
    }

    const addressMatch = content.match(/\\address\{([^}]+)\}\{([^}]+)\}/);
    if (addressMatch) {
      cvData.personalInfo.city = addressMatch[1];
      cvData.personalInfo.country = addressMatch[2];
    }

    const phoneMatch = content.match(/\\phone\[mobile\]\{([^}]+)\}/);
    if (phoneMatch) {
      cvData.personalInfo.phone = phoneMatch[1];
    }

    const emailMatch = content.match(/\\email\{([^}]+)\}/);
    if (emailMatch) {
      cvData.personalInfo.email = emailMatch[1];
    }

    const linkedinMatch = content.match(/\\social\[linkedin\]\{([^}]+)\}/);
    if (linkedinMatch) {
      cvData.personalInfo.linkedin = linkedinMatch[1];
    }

    // Extract sections
    const sectionRegex = /\\section\{([^}]+)\}([\s\S]*?)(?=\\section\{|\\end\{document\})/g;
    let sectionMatch;
    
    while ((sectionMatch = sectionRegex.exec(content)) !== null) {
      const sectionTitle = sectionMatch[1];
      const sectionContent = sectionMatch[2];
      
      const section = {
        title: sectionTitle,
        entries: []
      };
      
      // Extract cvitems (used for skills, etc.)
      const cvItemRegex = /\\cvitem\{([^}]+)\}\{([^}]+)\}/g;
      let cvItemMatch;
      
      while ((cvItemMatch = cvItemRegex.exec(sectionContent)) !== null) {
        section.entries.push({
          type: 'cvitem',
          title: cvItemMatch[1],
          content: cvItemMatch[2]
        });
      }
      
      // Extract cventries (used for experience, education, etc.)
      // First find all cventry starts
      const cvEntryStarts = [...sectionContent.matchAll(/\\cventry\{/g)].map(match => match.index);
      
      // Process each cventry
      for (let i = 0; i < cvEntryStarts.length; i++) {
        const entryStart = cvEntryStarts[i];
        const entryEnd = i < cvEntryStarts.length - 1 
          ? cvEntryStarts[i + 1] 
          : sectionContent.length;
        
        const entryContent = sectionContent.substring(entryStart, entryEnd);
        
        // Extract parameters
        const params = [];
        let bracketLevel = 0;
        let currentParam = '';
        let collecting = false;
        
        for (let j = '\\cventry{'.length; j < entryContent.length; j++) {
          const char = entryContent[j];
          
          if (char === '{') {
            bracketLevel++;
            if (bracketLevel === 1) {
              collecting = true;
              currentParam = '';
            } else if (collecting) {
              currentParam += char;
            }
          } else if (char === '}') {
            bracketLevel--;
            if (bracketLevel === 0 && collecting) {
              params.push(currentParam);
              collecting = false;
              if (params.length === 6) break;
            } else if (collecting) {
              currentParam += char;
            }
          } else if (collecting) {
            currentParam += char;
          }
        }
        
        if (params.length >= 6) {
          const entry = {
            type: 'cventry',
            date: params[0],
            title: params[1],
            organization: params[2],
            location: params[3],
            notes: params[4],
            description: params[5]
          };
          
          // Extract bullet points 
          const bulletPoints = [];
          
          // Try to find itemize environment
          const itemizeStart = entry.description.indexOf('\\begin{itemize');
          if (itemizeStart !== -1) {
            // Find all items
            const itemRegex = /\\item\s+([^\\]+)/g;
            const itemContent = entry.description.substring(itemizeStart);
            let itemMatch;
            
            while ((itemMatch = itemRegex.exec(itemContent)) !== null) {
              bulletPoints.push(itemMatch[1].trim());
            }
          } else {
            // Check for standalone \item tags
            const itemRegex = /\\item\s+([^\\]+)/g;
            let itemMatch;
            
            while ((itemMatch = itemRegex.exec(entry.description)) !== null) {
              bulletPoints.push(itemMatch[1].trim());
            }
            
            // If we didn't find bullets in the description, check the remaining content
            if (bulletPoints.length === 0 && entryEnd > entryStart + entryContent.length) {
              const remainingText = sectionContent.substring(entryStart + entryContent.length, entryEnd);
              while ((itemMatch = itemRegex.exec(remainingText)) !== null) {
                bulletPoints.push(itemMatch[1].trim());
              }
            }
          }
          
          if (bulletPoints.length > 0) {
            entry.bullets = bulletPoints;
          }
          
          section.entries.push(entry);
        }
      }
      
      cvData.sections.push(section);
    }
    
    return cvData;
  };

  // Function to render CV content to iframe
  const renderCVToIframe = (cvData) => {
    if (!iframeRef.current || !cvData) return;
    
    const doc = iframeRef.current.contentDocument;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Modern CV</title>
        <style>
          /* Modern CV Styles */
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Helvetica Neue', Arial, sans-serif;
          }

          body {
            background-color: white;
            color: #333;
            padding: 0;
            margin: 0;
            font-size: 10pt;
            line-height: 1.4;
          }

          .container {
            max-width: 100%;
            margin: 0 auto;
            padding: 25px 30px;
          }

          /* Header Styles */
          header {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #d0d0d0;
          }

          .name {
            font-size: 24pt;
            font-weight: 300;
            color: #2c3e50;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }

          .contact-info {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            font-size: 9pt;
            color: #555;
          }

          .contact-item {
            display: flex;
            align-items: center;
          }

          .contact-item:not(:last-child)::after {
            content: '•';
            margin-left: 12px;
            color: #aaa;
          }

          /* Section Styles */
          section {
            margin-bottom: 20px;
          }

          .section-title {
            font-size: 12pt;
            font-weight: 600;
            color: #2c3e50;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
            padding-bottom: 3px;
            border-bottom: 1px solid #eee;
          }

          /* CV Entry Styles */
          .cv-entry {
            margin-bottom: 14px;
            page-break-inside: avoid;
          }

          .cv-entry-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }

          .cv-entry-title {
            font-weight: 600;
            font-size: 10pt;
            color: #333;
          }

          .cv-entry-date {
            font-size: 9pt;
            color: #555;
          }

          .cv-entry-org {
            font-style: italic;
            margin-bottom: 3px;
            font-size: 9.5pt;
          }

          .cv-entry-bullets {
            margin-left: 18px;
            margin-top: 6px;
          }

          .cv-entry-bullets li {
            margin-bottom: 3px;
            font-size: 9.5pt;
          }

          /* CV Item Styles (Skills) */
          .cv-item {
            margin-bottom: 8px;
            display: flex;
          }

          .cv-item-title {
            font-weight: 600;
            min-width: 100px;
            margin-right: 10px;
          }

          .cv-item-content {
            flex: 1;
          }

          /* Bold text */
          .bold {
            font-weight: 600;
          }

          /* Media print styles */
          @media print {
            body {
              font-size: 10pt;
            }
            
            .container {
              padding: 20px;
            }
            
            section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${renderHeader(cvData.personalInfo)}
          ${renderSections(cvData.sections)}
        </div>
      </body>
      </html>
    `);
    doc.close();
  };

  // Helper function to render the header
  const renderHeader = (personalInfo) => {
    const fullName = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim();
    const location = personalInfo.city && personalInfo.country 
      ? `${personalInfo.city}, ${personalInfo.country}` 
      : '';
    
    return `
      <header>
        <div class="name">${fullName}</div>
        <div class="contact-info">
          ${location ? `<div class="contact-item">${location}</div>` : ''}
          ${personalInfo.phone ? `<div class="contact-item">${personalInfo.phone}</div>` : ''}
          ${personalInfo.email ? `<div class="contact-item">${personalInfo.email}</div>` : ''}
          ${personalInfo.linkedin ? `<div class="contact-item">${personalInfo.linkedin}</div>` : ''}
        </div>
      </header>
    `;
  };

  // Helper function to render all sections
  const renderSections = (sections) => {
    return sections.map(section => `
      <section>
        <h2 class="section-title">${section.title}</h2>
        ${renderSectionEntries(section.entries)}
      </section>
    `).join('');
  };

  // Helper function to render section entries
  const renderSectionEntries = (entries) => {
    return entries.map(entry => {
      if (entry.type === 'cvitem') {
        return renderCVItem(entry);
      } else if (entry.type === 'cventry') {
        return renderCVEntry(entry);
      }
      return '';
    }).join('');
  };

  // Helper function to render a CV item (for skills, etc.)
  const renderCVItem = (item) => {
    return `
      <div class="cv-item">
        <div class="cv-item-title">${cleanText(item.title)}:</div>
        <div class="cv-item-content">${cleanText(item.content)}</div>
      </div>
    `;
  };

  // Helper function to render a CV entry (for experience, education, etc.)
  const renderCVEntry = (entry) => {
    let bulletsHtml = '';
    if (entry.bullets && entry.bullets.length > 0) {
      bulletsHtml = `
        <ul class="cv-entry-bullets">
          ${entry.bullets.map(bullet => `<li>${cleanText(bullet)}</li>`).join('')}
        </ul>
      `;
    }
    
    return `
      <div class="cv-entry">
        <div class="cv-entry-header">
          <div class="cv-entry-title">${cleanText(entry.title)}</div>
          <div class="cv-entry-date">${cleanText(entry.date)}</div>
        </div>
        <div class="cv-entry-org">
          ${cleanText(entry.organization)}${entry.location ? `, ${cleanText(entry.location)}` : ''}
        </div>
        ${bulletsHtml}
      </div>
    `;
  };

  // Helper function to clean LaTeX text
  const cleanText = (text) => {
    if (!text) return '';
    
    return text
      .replace(/\\textbf\{([^}]+)\}/g, '<span class="bold">$1</span>')
      .replace(/\\\%/g, '%')
      .replace(/\\&/g, '&')
      .replace(/\\\$/g, '$')
      .replace(/\\_/g, '_');
  };

  // Handle print/save
  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.print();
    }
  };

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

  return (
    <div className="w-full h-[600px] border rounded-lg overflow-hidden bg-white flex flex-col">
      <iframe
        ref={iframeRef}
        className="w-full flex-1"
        title={title || "CV Preview"}
      />
      <div className="flex justify-end bg-gray-100 p-2">
        <button 
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          onClick={onPrint || handlePrint}
        >
          Print/Save as PDF
        </button>
      </div>
    </div>
  );
};

export default ModernCVRenderer; 