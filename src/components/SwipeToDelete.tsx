import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export default function SwipeToDelete({ children, onDelete }: SwipeToDeleteProps) {
  const [startX, setStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null) return;
    const x = e.touches[0].clientX - startX;
    if (x < 0) {
      setCurrentX(Math.max(x, -100));
    }
  };

  const handleTouchEnd = () => {
    if (currentX < -70) {
      setIsDeleting(true);
      setTimeout(() => {
        onDelete();
        setIsDeleting(false);
        setCurrentX(0);
      }, 300);
    } else {
      setCurrentX(0);
    }
    setStartX(null);
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem]">
      <div
        className="absolute inset-0 bg-red-500 flex items-center justify-end px-8 text-white transition-opacity"
        style={{ opacity: currentX < -20 ? 1 : 0 }}
      >
        <Trash2 size={24} />
      </div>
      <div
        style={{
          transform: `translateX(${currentX}px)`,
          transition: startX === null ? 'transform 0.3s ease' : 'none',
          opacity: isDeleting ? 0 : 1
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
