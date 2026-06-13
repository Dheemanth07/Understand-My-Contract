// Spinner.tsx
import React from "react";

type SpinnerProps = {
    size?: number;
};

const Spinner: React.FC<SpinnerProps> = ({ size = 40 }) => {
    const sizeClass =
        size === 24
            ? "h-6 w-6"
            : size === 32
              ? "h-8 w-8"
              : size === 48
                ? "h-12 w-12"
                : "h-10 w-10";

    return (
        <div
            className={`${sizeClass} animate-spin rounded-full border-4 border-t-blue-500 border-gray-300`}
            aria-label="Loading"
        ></div>
    );
};

export default Spinner;
