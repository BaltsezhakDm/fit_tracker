import React, { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

export default function SwipeToDelete({ children, onDelete, threshold = 60 }) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const containerRef = useRef(null);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;

    // Only allow swipe left
    if (diff < 0) {
      // Add resistance when pulling past threshold
      const newTranslate = diff < -threshold * 1.5
        ? -threshold * 1.5 - (Math.abs(diff) - threshold * 1.5) * 0.2
        : diff;
      setTranslateX(newTranslate);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (translateX < -threshold) {
      // Action triggered
      setTranslateX(-threshold);
    } else {
      setTranslateX(0);
    }
  };

  useEffect(() => {
    // Reset if external factors change
    setTranslateX(0);
  }, [children]);

  return (
    <div className="relative overflow-hidden w-full group rounded-3xl" ref={containerRef}>
      {/* Background Delete Button */}
      <div
        className="absolute inset-y-0 right-0 bg-red-500 text-white flex items-center justify-end px-6 w-full rounded-3xl"
        style={{ opacity: Math.min(Math.abs(translateX) / threshold, 1) }}
      >
        <button
          onClick={() => onDelete()}
          className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
        >
          <Trash2 size={24} />
          <span className="text-[10px] font-bold">Удалить</span>
        </button>
      </div>

      {/* Foreground Content */}
      <div
        className="relative bg-transparent transition-transform duration-200 w-full"
        style={{
          transform: `translateX(${translateX}px)`,
          transitionTimingFunction: isSwiping ? 'linear' : 'cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDuration: isSwiping ? '0ms' : '200ms'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}