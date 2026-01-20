import React from 'react';

export const Spinner = ({ className, size = 24, align = 'center' }) => {
    // Simple Tailwind SVG Spinner
    const spinner = (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`animate-spin ${className || ''}`}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );

    if (align === 'center') {
        return <div className="flex justify-center items-center">{spinner}</div>;
    }

    return spinner;
};

export const LoadingState = ({ message = "Loading..." }) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4 min-h-[400px]">
            <Spinner className="text-primary h-10 w-10" size={40} />
            <p className="text-muted-foreground animate-pulse font-medium">{message}</p>
        </div>
    );
};
