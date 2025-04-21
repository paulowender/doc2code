"use client";

import { useEffect, useState } from "react";

interface ProgressBarProps {
  progress: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
}

const ProgressBar = ({
  progress,
  total,
  label,
  showPercentage = true,
}: ProgressBarProps) => {
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const calculatedPercentage =
      total > 0 ? Math.round((progress / total) * 100) : 0;
    setPercentage(calculatedPercentage);
    console.log(
      `Progress updated: ${progress}/${total} (${calculatedPercentage}%)`
    );
  }, [progress, total]);

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
        <div
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {progress > 0 && total > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {progress} de {total} {progress === 1 ? "parte" : "partes"} processada
          {progress === 1 ? "" : "s"}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
