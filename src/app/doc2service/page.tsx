'use client';

import { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import InputArea from '@/components/doc2service/InputArea';
import FileUpload from '@/components/doc2service/FileUpload';
import LanguageSelector from '@/components/doc2service/LanguageSelector';
import AIProviderSelector from '@/components/doc2service/AIProviderSelector';
import OutputArea from '@/components/doc2service/OutputArea';
import { toast } from 'react-toastify';

type AIProvider = 'openai' | 'openrouter' | 'groq';
type Language = 'javascript' | 'python' | 'java' | 'csharp' | 'go' | 'ruby' | 'php' | 'typescript';

const Doc2ServicePage = () => {
  const [inputText, setInputText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('javascript');
  const [selectedAIProvider, setSelectedAIProvider] = useState<AIProvider>('openai');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSDK, setGeneratedSDK] = useState('');

  const handleTextChange = (text: string) => {
    setInputText(text);
  };

  const handleFileUpload = (content: string) => {
    setInputText(content);
    toast.success('File uploaded successfully!');
  };

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
  };

  const handleAIProviderChange = (provider: AIProvider) => {
    setSelectedAIProvider(provider);
  };

  const generateSDK = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter documentation text or upload a file');
      return;
    }

    setIsGenerating(true);
    setGeneratedSDK('');

    try {
      const response = await fetch('/api/generate-sdk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentation: inputText,
          language: selectedLanguage,
          aiProvider: selectedAIProvider,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate SDK');
      }

      const data = await response.json();
      setGeneratedSDK(data.sdk);
      toast.success('SDK generated successfully!');
    } catch (error) {
      console.error('Error generating SDK:', error);
      toast.error('Failed to generate SDK. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedSDK) {
      toast.error('No SDK to download');
      return;
    }

    const fileExtensions: Record<Language, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      csharp: 'cs',
      go: 'go',
      ruby: 'rb',
      php: 'php',
    };

    const extension = fileExtensions[selectedLanguage];
    const fileName = `generated-sdk.${extension}`;
    const blob = new Blob([generatedSDK], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            doc2service
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
            Convert documentation into ready-to-use SDKs with AI integration
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Input</h2>
            
            <div className="mb-6">
              <FileUpload onFileUpload={handleFileUpload} />
            </div>
            
            <div className="mb-6">
              <InputArea value={inputText} onChange={handleTextChange} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <LanguageSelector 
                selectedLanguage={selectedLanguage} 
                onLanguageChange={handleLanguageChange} 
              />
              
              <AIProviderSelector 
                selectedProvider={selectedAIProvider} 
                onProviderChange={handleAIProviderChange} 
              />
            </div>
            
            <button
              onClick={generateSDK}
              disabled={isGenerating || !inputText.trim()}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate SDK'}
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Output</h2>
              
              <button
                onClick={handleDownload}
                disabled={!generatedSDK}
                className="py-1 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download
              </button>
            </div>
            
            <OutputArea code={generatedSDK} language={selectedLanguage} isLoading={isGenerating} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Doc2ServicePage;
