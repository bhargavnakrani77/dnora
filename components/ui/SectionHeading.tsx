import React from "react";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  className = "",
}: SectionHeadingProps) {
  return (
    <div className={`text-center mb-6 sm:mb-8 md:mb-10 ${className}`}>
      <h2
        style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}
        className="text-lg sm:text-xl md:text-2xl font-semibold tracking-[0.2em] uppercase text-neutral-900"
      >
        {title}
      </h2>
      <div className="w-8 h-[1.5px] bg-neutral-900 mx-auto mt-2" />
      {subtitle && (
        <p className="mt-2 text-xs sm:text-sm text-neutral-500 font-light tracking-wide max-w-lg mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default SectionHeading;
