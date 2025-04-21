"use client";

import { useState, useEffect, useRef } from "react";
import MainLayout from "@/components/MainLayout";
import InputArea from "@/components/doc2service/InputArea";
import FileUpload from "@/components/doc2service/FileUpload";
import LanguageSelector from "@/components/doc2service/LanguageSelector";
import AIProviderSelector from "@/components/doc2service/AIProviderSelector";
import ModelSelector from "@/components/doc2service/ModelSelector";
import AdvancedOptions from "@/components/doc2service/AdvancedOptions";
import ProgressBar from "@/components/doc2service/ProgressBar";
import OutputArea from "@/components/doc2service/OutputArea";
import { toast } from "react-toastify";
import clientLogger from "@/lib/clientLogger";
import { getDefaultModel } from "@/lib/ai-models";
import { minifyText } from "@/lib/utils/truncateText";

type AIProvider = "openai" | "openrouter" | "groq";
type Language =
  | "javascript"
  | "python"
  | "java"
  | "csharp"
  | "go"
  | "ruby"
  | "php"
  | "typescript";

const Doc2ServicePage = () => {
  const [inputText, setInputText] = useState("");
  const [selectedLanguage, setSelectedLanguage] =
    useState<Language>("javascript");
  const [selectedAIProvider, setSelectedAIProvider] =
    useState<AIProvider>("openai");
  const [selectedModel, setSelectedModel] = useState(getDefaultModel("openai"));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSDK, setGeneratedSDK] = useState("");
  const [useMinify, setUseMinify] = useState(false);
  const [useChunking, setUseChunking] = useState(false);
  // const [processedText, setProcessedText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    status: "idle",
  });
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const handleTextChange = (text: string) => {
    // setInputText(text);
    updateProcessedText(text, useMinify);
  };

  const updateProcessedText = (text: string, minify: boolean) => {
    if (minify) {
      setInputText(minifyText(text));
    } else {
      setInputText(text);
    }
  };

  const handleFileUpload = (content: string) => {
    // setInputText(minifyText(content));
    updateProcessedText(content, useMinify);
    toast.success("File uploaded successfully!");
    clientLogger.info("File uploaded successfully", {
      contentLength: content.length,
    });
  };

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
    clientLogger.info("Language changed", { language });
  };

  const handleAIProviderChange = (provider: AIProvider) => {
    setSelectedAIProvider(provider);
    // Set default model for the new provider
    const defaultModel = getDefaultModel(provider);
    setSelectedModel(defaultModel);
    clientLogger.info("AI provider changed", { provider, defaultModel });
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    clientLogger.info("Model changed", { model, provider: selectedAIProvider });
  };

  const handleMinifyChange = (minify: boolean) => {
    setUseMinify(minify);
    updateProcessedText(inputText, minify);
    clientLogger.info("Minify option changed", { minify });
  };

  const handleChunkingChange = (chunking: boolean) => {
    setUseChunking(chunking);
    clientLogger.info("Chunking option changed", { chunking });
  };

  const generateSDK = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter documentation text or upload a file");
      clientLogger.warn("Attempted to generate SDK with empty input");
      return;
    }

    setIsGenerating(true);
    setGeneratedSDK("");
    setProgress({ current: 0, total: 1, status: "initializing" });

    clientLogger.info("Generating SDK", {
      language: selectedLanguage,
      aiProvider: selectedAIProvider,
      model: selectedModel,
      inputLength: inputText.length,
    });

    try {
      const response = await fetch("/api/generate-sdk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentation: inputText,
          language: selectedLanguage,
          aiProvider: selectedAIProvider,
          model: selectedModel,
          minify: useMinify,
          useChunking: useChunking,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }

        clientLogger.error("API returned error", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });

        // Check for token limit errors
        if (errorData.error && errorData.error.includes("token")) {
          toast.error(
            "Documentation is too large. It has been truncated, but may still exceed limits. Try with a smaller document or different model."
          );
        } else {
          throw new Error(
            `Failed to generate SDK: ${response.status} ${response.statusText}`
          );
        }
      }

      const data = await response.json();
      setGeneratedSDK(data.sdk);
      setSessionId(data.sessionId);
      toast.success("SDK generated successfully!");
      clientLogger.info("SDK generated successfully", {
        language: selectedLanguage,
        aiProvider: selectedAIProvider,
        model: selectedModel,
        sdkLength: data.sdk.length,
        sessionId: data.sessionId,
      });

      // Set progress to complete
      setProgress({ current: 1, total: 1, status: "complete" });
    } catch (error) {
      console.error("Error generating SDK:", error);
      clientLogger.error("Error generating SDK", {
        error: error instanceof Error ? error.message : String(error),
      });
      // Check for specific error types
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (
        errorMsg.includes("413") ||
        errorMsg.includes("too large") ||
        errorMsg.includes("token")
      ) {
        toast.error(
          "Documentation is too large for the selected model. Try with a smaller document or a different model."
        );
      } else if (errorMsg.includes("rate limit") || errorMsg.includes("429")) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
      } else {
        toast.error("Failed to generate SDK. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedSDK) {
      toast.error("No SDK to download");
      clientLogger.warn("Attempted to download with no SDK generated");
      return;
    }

    clientLogger.info("Downloading SDK", { language: selectedLanguage });

    const fileExtensions: Record<Language, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      csharp: "cs",
      go: "go",
      ruby: "rb",
      php: "php",
    };

    const extension = fileExtensions[selectedLanguage];
    const fileName = `generated-sdk.${extension}`;
    const blob = new Blob([generatedSDK], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    clientLogger.info("SDK downloaded", { fileName });
  };

  // Poll for progress updates when generating SDK
  useEffect(() => {
    if (isGenerating && sessionId) {
      console.log(`Starting progress polling for session ${sessionId}`);

      // Fetch progress immediately
      const fetchProgress = async () => {
        try {
          const response = await fetch(
            `/api/generate-sdk/progress?sessionId=${sessionId}`
          );
          if (response.ok) {
            const progressData = await response.json();
            console.log("Progress data received:", progressData);
            setProgress(progressData);

            // If complete, stop polling
            if (progressData.status === "complete") {
              console.log("Processing complete, stopping polling");
              if (progressInterval.current) {
                clearInterval(progressInterval.current);
                progressInterval.current = null;
              }
            }
          } else {
            console.warn(
              "Failed to fetch progress:",
              response.status,
              response.statusText
            );
          }
        } catch (error) {
          console.error("Error fetching progress", error);
        }
      };

      // Fetch immediately
      fetchProgress();

      // Start polling for progress updates
      progressInterval.current = setInterval(fetchProgress, 1000);

      // Clean up interval on unmount or when generation is complete
      return () => {
        console.log("Cleaning up progress polling interval");
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
      };
    }
  }, [isGenerating, sessionId]);

  // Log page view on component mount
  useEffect(() => {
    clientLogger.info("Doc2Service page viewed");

    // Flush logs when component unmounts
    return () => {
      clientLogger.flush();
    };
  }, []);

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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Input
            </h2>

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

            <div className="mb-6">
              <ModelSelector
                selectedModel={selectedModel}
                aiProvider={selectedAIProvider}
                onModelChange={handleModelChange}
              />
            </div>

            <div className="mb-6">
              <AdvancedOptions
                text={inputText}
                aiProvider={selectedAIProvider}
                model={selectedModel}
                onMinifyChange={handleMinifyChange}
                onChunkingChange={handleChunkingChange}
              />
            </div>

            {isGenerating && progress.total > 0 && (
              <div className="mb-4">
                <ProgressBar
                  progress={progress.current}
                  total={progress.total}
                  label={`Generating SDK${
                    useChunking ? " (Processing in chunks)" : ""
                  }`}
                  showPercentage={true}
                />
              </div>
            )}

            <button
              onClick={generateSDK}
              disabled={isGenerating || !inputText.trim()}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? "Generating..." : "Generate SDK"}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Output
              </h2>

              <button
                onClick={handleDownload}
                disabled={!generatedSDK}
                className="py-1 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download
              </button>
            </div>

            <OutputArea
              code={generatedSDK}
              language={selectedLanguage}
              isLoading={isGenerating}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Doc2ServicePage;
