"use client";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const NavigationLoader = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start animation on route change
    setIsVisible(true);
    setProgress(0);

    // Initial burst
    const t1 = setTimeout(() => setProgress(30), 100);
    // Continue
    const t2 = setTimeout(() => setProgress(70), 300);
    // Finish
    const t3 = setTimeout(() => setProgress(100), 500);

    // Hide
    const t4 = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [location.pathname]); // Trigger on pathname change

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed top-0 left-0 right-0 z-[10000] pointer-events-none h-1">
          <motion.div
            className="h-full bg-emerald-500"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            exit={{ opacity: 0 }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default NavigationLoader;
