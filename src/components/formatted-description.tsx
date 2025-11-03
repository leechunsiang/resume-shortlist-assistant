'use client';

import { formatDescription } from '@/lib/utils';

interface FormattedDescriptionProps {
  description: string;
  className?: string;
}

export function FormattedDescription({ description, className = '' }: FormattedDescriptionProps) {
  const { sections, hasStructure } = formatDescription(description);

  // If no structure detected, show as plain text
  if (!hasStructure || sections.length === 0) {
    return (
      <p className={`text-gray-300 leading-relaxed whitespace-pre-wrap ${className}`}>
        {description}
      </p>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          {section.title !== 'Description' && (
            <h4 className="text-base font-bold text-white mb-3">
              {section.title}
            </h4>
          )}
          <ul className="space-y-2.5">
            {section.items.map((item, itemIndex) => (
              <li 
                key={itemIndex} 
                className="flex items-start gap-3 text-gray-300 leading-relaxed"
              >
                <span className="text-emerald-400 mt-1.5 flex-shrink-0">
                  <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
