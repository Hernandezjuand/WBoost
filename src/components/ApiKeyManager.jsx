import React, { useState, useEffect } from 'react';

const ApiKeyManager = ({ onApiKeysSet }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempKeys, setTempKeys] = useState({
    openai: '',
    anthropic: '',
    deepseek: '',
    gemini: ''
  });
  const [selectedProviders, setSelectedProviders] = useState({
    openai: true,
    anthropic: true,
    deepseek: true,
    gemini: true
  });

  useEffect(() => {
    const savedKeys = localStorage.getItem('apiKeys');
    const savedProviders = localStorage.getItem('selectedProviders');
    if (savedKeys) {
      setTempKeys(JSON.parse(savedKeys));
    }
    if (savedProviders) {
      setSelectedProviders(JSON.parse(savedProviders));
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onApiKeysSet({ ...tempKeys, selectedProviders });
    localStorage.setItem('apiKeys', JSON.stringify(tempKeys));
    localStorage.setItem('selectedProviders', JSON.stringify(selectedProviders));
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    const savedKeys = localStorage.getItem('apiKeys');
    const savedProviders = localStorage.getItem('selectedProviders');
    if (savedKeys) {
      setTempKeys(JSON.parse(savedKeys));
    }
    if (savedProviders) {
      setSelectedProviders(JSON.parse(savedProviders));
    }
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTempKeys(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProviderToggle = (provider) => {
    setSelectedProviders(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const maskApiKey = (key) => {
    if (!key) return '';
    return '•'.repeat(4) + key.slice(-4);
  };

  return (
    <div className="card p-6 bg-card text-card-foreground rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">AI Configuration</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your AI providers and API keys
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Edit Configuration
          </button>
        )}
      </div>

      {/* API Provider Recommendation Notice */}
      <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <h3 className="font-medium text-blue-800 dark:text-blue-300 flex items-center">
          <span className="mr-2">💡</span>
          API Key Recommendation
        </h3>
        <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
          <strong>Gemini</strong> is recommended as it offers a <strong>free tier</strong> with the first API key at no cost.
          All API providers require sign-up, but Gemini provides the most accessible option for testing.
        </p>
      </div>

      {!isEditing ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">OpenAI</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${selectedProviders.openai ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {selectedProviders.openai ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">API Key: {maskApiKey(tempKeys.openai)}</p>
            </div>

            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Anthropic</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${selectedProviders.anthropic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {selectedProviders.anthropic ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">API Key: {maskApiKey(tempKeys.anthropic)}</p>
            </div>

            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">DeepSeek</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${selectedProviders.deepseek ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {selectedProviders.deepseek ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">API Key: {maskApiKey(tempKeys.deepseek)}</p>
            </div>

            <div className="p-4 border rounded-lg bg-card relative">
              <div className="absolute -top-2 -right-2">
                <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full shadow-sm">Recommended</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Gemini</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${selectedProviders.gemini ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {selectedProviders.gemini ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">API Key: {maskApiKey(tempKeys.gemini)}</p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">OpenAI</h3>
                  <p className="text-sm text-muted-foreground">GPT-4 powered analysis</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProviders.openai}
                    onChange={() => handleProviderToggle('openai')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <input
                type="password"
                name="openai"
                value={tempKeys.openai}
                onChange={handleChange}
                placeholder="Enter OpenAI API key (sk-...)"
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="mt-2 text-xs text-gray-500">
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Get your API key from OpenAI Platform
                </a>
                <p className="mt-1">Requires credit card. Pay-as-you-go pricing.</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Anthropic</h3>
                  <p className="text-sm text-muted-foreground">Claude powered analysis</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProviders.anthropic}
                    onChange={() => handleProviderToggle('anthropic')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <input
                type="password"
                name="anthropic"
                value={tempKeys.anthropic}
                onChange={handleChange}
                placeholder="Enter Anthropic API key (sk-ant-...)"
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="mt-2 text-xs text-gray-500">
                <a 
                  href="https://console.anthropic.com/settings/keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Get your API key from Anthropic Console
                </a>
                <p className="mt-1">Requires credit card. Pay-as-you-go pricing.</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">DeepSeek</h3>
                  <p className="text-sm text-muted-foreground">DeepSeek Chat powered analysis</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProviders.deepseek}
                    onChange={() => handleProviderToggle('deepseek')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <input
                type="password"
                name="deepseek"
                value={tempKeys.deepseek}
                onChange={handleChange}
                placeholder="Enter DeepSeek API key"
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="mt-2 text-xs text-gray-500">
                <a 
                  href="https://platform.deepseek.com/api_keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Get your API key from DeepSeek Platform
                </a>
                <p className="mt-1">Requires sign-up. Has some free trial credits.</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-card border-green-200 bg-green-50/30 dark:bg-green-900/10">
              <div className="absolute -top-2 -right-2">
                <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full shadow-sm">Recommended</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold flex items-center">
                    Gemini 
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-md">Free Tier Available</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">Google's Gemini AI - Recommended for best results</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProviders.gemini}
                    onChange={() => handleProviderToggle('gemini')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <input
                type="password"
                name="gemini"
                value={tempKeys.gemini}
                onChange={handleChange}
                placeholder="Enter Gemini API key"
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="mt-2 text-xs text-gray-500">
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Get your FREE API key from Google AI Studio
                </a>
                <p className="mt-1">No credit card required. First API key is completely free with generous quota.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Save Configuration
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ApiKeyManager; 