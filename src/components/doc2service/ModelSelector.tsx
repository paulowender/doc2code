"use client";

import { Fragment, useEffect } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { AIModel, getModelsByProvider, getDefaultModel } from "@/lib/ai-models";
import { SparklesIcon, AlertCircleIcon, TagIcon, Loader2 } from "lucide-react";
import { useApiKeys } from "@/hooks/useApiKeys";

interface ModelSelectorProps {
  selectedModel: string;
  aiProvider: "openai" | "openrouter" | "groq";
  onModelChange: (model: string) => void;
}

const ModelSelector = ({
  selectedModel,
  aiProvider,
  onModelChange,
}: ModelSelectorProps) => {
  // Get API keys status
  const { apiKeys, loading, error } = useApiKeys();

  // Get models for the selected provider
  const models = apiKeys[aiProvider] ? getModelsByProvider(aiProvider) : [];

  // Update selected model when provider changes
  useEffect(() => {
    if (
      apiKeys[aiProvider] &&
      !models.find((model) => model.id === selectedModel)
    ) {
      const defaultModel = getDefaultModel(aiProvider);
      onModelChange(defaultModel);
    }
  }, [aiProvider, selectedModel, onModelChange, models, apiKeys]);

  const selected =
    models.find((model) => model.id === selectedModel) || models[0];

  // Show loading state
  if (loading) {
    return (
      <div className="dropdown-container">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          AI Model
        </label>
        <div className="relative mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-left shadow-sm">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-indigo-500 animate-spin mr-2" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Loading available models...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // If no token is configured, show a message instead of the selector
  if (!apiKeys[aiProvider]) {
    return (
      <div className="dropdown-container">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          AI Model
        </label>
        <div className="relative mt-1 w-full rounded-md border border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 py-2 px-3 text-left shadow-sm">
          <div className="flex items-center">
            <AlertCircleIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
            <span className="text-sm text-yellow-700 dark:text-yellow-400">
              No API key configured for {aiProvider}. Please add your API key to
              .env.local
            </span>
          </div>
        </div>
      </div>
    );
  }

  // If no models are available or selected is null, return null
  if (!selected) return null;

  return (
    <div className="dropdown-container">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        AI Model
      </label>
      <Listbox value={selected} onChange={(value) => onModelChange(value.id)}>
        <div className="relative mt-1">
          <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
            <div className="flex items-center truncate">
              <span className="block truncate text-gray-900 dark:text-gray-100">
                {selected.name}
              </span>
              {selected.recommended && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 model-badge">
                  <SparklesIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span>Recommended</span>
                </span>
              )}
              {selected.free && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 model-badge">
                  <TagIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span>Free</span>
                </span>
              )}
            </div>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-20 mt-1 max-h-48 w-full rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm overflow-y-auto scrollbar-thin scrollbar-hide-not-hover">
              {models.map((model) => (
                <Listbox.Option
                  key={model.id}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active
                        ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-100"
                        : "text-gray-900 dark:text-gray-100"
                    } hover:bg-indigo-50 dark:hover:bg-indigo-900/30`
                  }
                  value={model}
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex flex-col py-1">
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          } flex items-center`}
                        >
                          {model.name}
                          {model.recommended && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 model-badge">
                              <SparklesIcon className="h-3 w-3 mr-1" />
                              Recommended
                            </span>
                          )}
                          {model.free && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 model-badge">
                              <TagIcon className="h-3 w-3 mr-1" />
                              Free
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 model-description">
                          {model.description}
                        </span>
                      </div>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            active
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "text-indigo-600 dark:text-indigo-400"
                          }`}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};

export default ModelSelector;
