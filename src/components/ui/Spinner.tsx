// Spinner.tsx
import React from "react";

type SpinnerProps = {
    size?: number;
};

const Spinner: React.FC<SpinnerProps> = ({ size = 40 }) => (
    <div
        className="animate-spin rounded-full border-4 border-t-blue-500 border-gray-300"
        style={{ width: size, height: size }}
        aria-label="Loading"
    ></div>
);

export default Spinner;
