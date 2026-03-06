import { useState } from 'react';

interface TruncatedTextProps {
  text: string | null | undefined;
  maxLength?: number;
  className?: string;
}

export function TruncatedText({ text, maxLength = 30, className = '' }: TruncatedTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text) {
    return <span className={className}>-</span>;
  }

  const isTruncated = text.length > maxLength;
  const displayText = isExpanded ? text : text.substring(0, maxLength);

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className={isExpanded ? 'whitespace-normal break-words' : 'truncate'}>{displayText}</span>
      {isTruncated && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[10px] text-muted-foreground hover:text-foreground hover:underline whitespace-nowrap text-left"
        >
          {isExpanded ? 'see less' : 'see more'}
        </button>
      )}
    </div>
  );
}
