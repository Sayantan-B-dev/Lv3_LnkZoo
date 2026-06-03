"use client";

import { useEffect, useState } from "react";
import { useLoading } from "@/context/LoadingContext";

export default function CustomCursor() {
  const { isLoading } = useLoading();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [type, setType] = useState("default");
  const [isVisible, setIsVisible] = useState(false);
  const [pointerFine, setPointerFine] = useState(false);

  useEffect(() => {
    setPointerFine(window.matchMedia("(pointer: fine)").matches);
  }, []);

  useEffect(() => {
    if (!pointerFine) return;
    // Show cursor immediately if loading
    if (isLoading && !isVisible) {
      setIsVisible(true);
      // Center it if we don't have a position yet
      if (position.x === 0 && position.y === 0) {
        setPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      }
    }

    const updatePosition = (x: number, y: number) => {
      setPosition({ x, y });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseMove = (e: MouseEvent) => updatePosition(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        updatePosition(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const computedStyle = window.getComputedStyle(target);
      const cursor = computedStyle.cursor;

      if (cursor === "pointer" || target.tagName === "A" || target.tagName === "BUTTON") {
        setType("pointer");
      } else if (cursor === "grab" || cursor === "grabbing") {
        setType("grab");
      } else {
        setType("default");
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("touchstart", (e) => {
      if (e.touches[0]) updatePosition(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isVisible, isLoading, position.x, position.y, pointerFine]);

  if (!pointerFine || !isVisible) return null;

  return (
    <div 
      className={`custom-cursor-wrapper ${type} ${isLoading ? 'loading' : ''}`}
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px` 
      }}
    >
      <div className="cursor-dot"></div>
      <div className="cursor-outline">
        {isLoading && (
          <div className="cursor-loader">
            <svg viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
            </svg>
          </div>
        )}
      </div>
      
      {type === "grab" && !isLoading && (
        <div className="cursor-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
        </div>
      )}
    </div>
  );
}