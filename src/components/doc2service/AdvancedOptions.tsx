"use client";

import { useState, useEffect } from "react";
import { Switch } from "@headlessui/react";
import { InfoIcon } from "lucide-react";
import { estimateTokens, getModelTokenLimit } from "@/lib/utils/truncateText";

interface AdvancedOptionsProps {
  text: string;
  aiProvider: "openai" | "openrouter" | "groq";
  model: string;
  onMinifyChange: (minify: boolean) => void;
  onChunkingChange: (chunking: boolean) => void;
}

const AdvancedOptions = ({
  text,
  aiProvider,
  model,
  onMinifyChange,
  onChunkingChange,
}: AdvancedOptionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [minify, setMinify] = useState(false);
  const [useChunking, setUseChunking] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [modelLimit, setModelLimit] = useState(0);

  // Update token count when text changes
  useEffect(() => {
    if (text) {
      const count = estimateTokens(text);
      setTokenCount(count);
    } else {
      setTokenCount(0);
    }
  }, [text]);

  // Update model limit when model or provider changes
  useEffect(() => {
    if (model && aiProvider) {
      const limit = getModelTokenLimit(aiProvider, model);
      setModelLimit(limit);
    }
  }, [model, aiProvider]);

  // Handle minify toggle
  const handleMinifyToggle = (checked: boolean) => {
    setMinify(checked);
    onMinifyChange(checked);
  };

  // Handle chunking toggle
  const handleChunkingToggle = (checked: boolean) => {
    setUseChunking(checked);
    onChunkingChange(checked);
  };

  // Calculate token usage percentage
  const tokenPercentage = modelLimit > 0 ? (tokenCount / modelLimit) * 100 : 0;

  // Determine token count color based on percentage
  const getTokenCountColor = () => {
    if (tokenPercentage > 90) return "text-red-500";
    if (tokenPercentage > 70) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
      >
        <span className="mr-1">{isOpen ? "▼" : "►"}</span>
        Advanced Options
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Token Count:
                </span>
                <span
                  className={`ml-2 text-sm font-bold ${getTokenCountColor()}`}
                  title="Estimated number of tokens in your text"
                >
                  {tokenCount.toLocaleString()} / {modelLimit.toLocaleString()}
                </span>
                <InfoIcon
                  className="h-4 w-4 ml-1 text-gray-400"
                  aria-label="Estimated number of tokens in your text"
                />
              </div>

              <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    tokenPercentage > 90
                      ? "bg-red-500"
                      : tokenPercentage > 70
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(tokenPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Minify Text
                </span>
                <InfoIcon
                  className="h-4 w-4 ml-1 text-gray-400"
                  title="Remove unnecessary whitespace and comments to reduce token count"
                />
              </div>
              <Switch
                checked={minify}
                onChange={handleMinifyToggle}
                className={`${
                  minify ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    minify ? "translate-x-6" : "translate-x-1"
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Process in Chunks
                </span>
                <InfoIcon
                  className="h-4 w-4 ml-1 text-gray-400"
                  title="Split large documents into smaller chunks and process them separately"
                />
              </div>
              <Switch
                checked={useChunking}
                onChange={handleChunkingToggle}
                className={`${
                  useChunking ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    useChunking ? "translate-x-6" : "translate-x-1"
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedOptions;
