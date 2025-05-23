import React from "react";

type LoadingSpinnerProps = {
  size?: "small" | "medium" | "large";
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "medium" }) => {
  const sizeClass = {
    small: "h-4 w-4",
    medium: "h-5 w-5",
    large: "h-8 w-8",
  }[size];


  return (
    <svg
      className={`animate-spin ${sizeClass}`}
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};

export default LoadingSpinner;
