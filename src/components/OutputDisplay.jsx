import React, { useState } from 'react';

function OutputDisplay({ documents }) {
  const [activeTab, setActiveTab] = useState('resume');
  const [activeProvider, setActiveProvider] = useState('openai');

  const tabs = [
    { id: 'resume', label: 'Resume' },
    { id: 'coverLetter', label: 'Cover Letter' },
    { id: 'followUpEmail', label: 'Follow-up Email' }
  ];

  const providers = [
    { id: 'openai', label: 'OpenAI' },
    { id: 'deepseek', label: 'DeepSeek' }
  ];

  const handleDownload = (content, type, provider) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${type}-${provider}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold text-card-foreground">
          Generated Documents
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          View and download your generated documents
        </p>
      </div>

      <div className="card-body space-y-4">
        <div className="flex space-x-4">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setActiveProvider(provider.id)}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeProvider === provider.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {provider.label}
            </button>
          ))}
        </div>

        <div className="flex space-x-4 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {documents[activeProvider][activeTab] && (
            <>
              <div className="bg-muted p-4 rounded-md">
                <pre className="whitespace-pre-wrap text-sm text-card-foreground">
                  {documents[activeProvider][activeTab]}
                </pre>
              </div>

              <button
                onClick={() =>
                  handleDownload(
                    documents[activeProvider][activeTab],
                    activeTab,
                    activeProvider
                  )
                }
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
              >
                Download {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </button>
            </>
          )}

          {activeTab === 'resume' && documents[activeProvider].analysis && (
            <div className="mt-4 space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <h3 className="text-sm font-medium text-card-foreground mb-2">
                  Resume Analysis
                </h3>
                <p className="text-sm text-card-foreground">
                  {documents[activeProvider].analysis}
                </p>
              </div>

              {documents[activeProvider].keywords && (
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="text-sm font-medium text-card-foreground mb-2">
                    Suggested Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {documents[activeProvider].keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OutputDisplay; 