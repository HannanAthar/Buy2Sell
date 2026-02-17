import { useRef } from "react";

const HoverImageContainer = ({ children, className = "" }) => {
  const hoverRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!hoverRef.current) return;

    const rect = hoverRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // NO LAG - DIRECT UPDATE
    hoverRef.current.style.setProperty("--mouse-x", `${x}%`);
    hoverRef.current.style.setProperty("--mouse-y", `${y}%`);
    hoverRef.current.style.setProperty("--opacity", "0.8"); /* Visible */
  };

  const handleMouseLeave = () => {
    if (!hoverRef.current) return;
    hoverRef.current.style.setProperty("--opacity", "0");
  };

  return (
    <div
      ref={hoverRef}
      className={`hover-layer ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

export default HoverImageContainer;
