'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Loader2 } from 'lucide-react';

type Language = 'javascript' | 'python' | 'java' | 'csharp' | 'go' | 'ruby' | 'php' | 'typescript';

interface OutputAreaProps {
  code: string;
  language: Language;
  isLoading: boolean;
}

const languageMap: Record<Language, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  csharp: 'csharp',
  go: 'go',
  ruby: 'ruby',
  php: 'php',
};

const OutputArea = ({ code, language, isLoading }: OutputAreaProps) => {
  const syntaxLanguage = languageMap[language];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Generating SDK...</p>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Generated SDK will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
      <SyntaxHighlighter
        language={syntaxLanguage}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '1rem',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          lineHeight: '1.25rem',
          height: '400px',
          overflow: 'auto',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default OutputArea;
