"use client";
import React from "react";

interface StepperProps {
  steps: string[];
  currentStep: number;
  onStepSelect?: (step: number) => void;
}

export default function Stepper({ steps, currentStep, onStepSelect }: StepperProps) {
  return (
    <div className="flex items-center justify-center space-x-0 md:space-x-4">
      {steps.map((label, index) => {
        const active = index === currentStep;
        const completed = index < currentStep;
        return (
          <div key={index} className="flex items-center">
            {/* Step circle */}
            <div 
              className={`flex items-center justify-center w-8 h-8 rounded-full 
                ${active ? "bg-blue-600 text-white" : completed ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"}`}
              style={{ minWidth: "2rem" }}
            >
              {completed ? "✓" : index + 1}
            </div>
            {/* Step label */}
            <button 
              className={`ml-2 text-sm font-medium ${active ? "text-blue-600" : "text-gray-600 hover:text-gray-800"}`}
              onClick={() => onStepSelect && onStepSelect(index)}
              disabled={!onStepSelect}
            >
              {label}
            </button>
            {index < steps.length - 1 && (
              <div className="hidden md:block flex-1 h-px bg-gray-300 mx-2"></div>
            )}
          </div>
        );
      })}
    </div>
  );
}
