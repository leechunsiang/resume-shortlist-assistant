import React, { useState, useEffect } from 'react';

interface TextTypeProps {
  text: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
  cursorChar?: string;
  onComplete?: () => void;
  className?: string;
}

const TextType: React.FC<TextTypeProps> = ({
  text,
  speed = 50,
  delay = 0,
  cursor = true,
  cursorChar = '|',
  onComplete,
  className = '',
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  // Reset state when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
    setShowCursor(true);
    setHasStarted(false);
  }, [text]);

  useEffect(() => {
    if (!hasStarted) {
      const startTimeout = setTimeout(() => {
        setHasStarted(true);
      }, delay);
      return () => clearTimeout(startTimeout);
    }
  }, [delay, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (!isComplete) {
      setIsComplete(true);
      setShowCursor(false);
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentIndex, text, speed, isComplete, onComplete, hasStarted]);

  useEffect(() => {
    if (cursor && !isComplete) {
      const cursorInterval = setInterval(() => {
        setShowCursor((prev) => !prev);
      }, 500);
      return () => clearInterval(cursorInterval);
    }
  }, [cursor, isComplete]);

  return (
    <span className={className}>
      {displayedText}
      {cursor && (
        <span
          className={`inline-block ml-0.5 ${showCursor ? 'opacity-100' : 'opacity-0'}`}
          style={{ transition: 'opacity 0.1s' }}
        >
          {cursorChar}
        </span>
      )}
    </span>
  );
};

export default TextType;
