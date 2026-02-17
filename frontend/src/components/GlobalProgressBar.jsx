"use client";

import { useEffect, useState, useRef } from "react";

const GlobalProgressBar = () => {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const progressRef = useRef(0);

  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const winHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const totalScroll = docHeight - winHeight;

      if (totalScroll <= 0) {
        progressRef.current = 0;
        setProgress(0);
        return;
      }

      // Calculate progress (0 to 100)
      const newProgress = (scrollTop / totalScroll) * 100;

      // Use linear interpolation for smooth transition
      const currentProgress = progressRef.current;
      const diff = newProgress - currentProgress;

      // Smooth step (adjust this value for speed: 0.1 = slower, 0.3 = faster)
      // 0.15 provides a good balance between responsiveness and smoothness
      progressRef.current = currentProgress + diff * 0.15;

      // Update state with rounded value to avoid excessive re-renders for micro-changes
      setProgress(Math.round(progressRef.current * 100) / 100);

      // Continue animation if we're not close enough to the target
      if (Math.abs(diff) > 0.1) {
        rafRef.current = requestAnimationFrame(updateProgress);
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        rafRef.current = requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
      }
    };

    // Add scroll listener with passive: true for better performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Initial update
    updateProgress();

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[9999] bg-transparent pointer-events-none progress-bar-container">
      <div
        className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 progress-bar-fill shadow-sm will-change-transform"
        style={{
          width: '100%',
          transformOrigin: '0 50%',
          transform: `scaleX(${progress / 100})`,
        }}
      />
    </div>
  );
};

export default GlobalProgressBar;
