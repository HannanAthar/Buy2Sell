import { useRef } from "react";

const HoverWrapper = ({
  children,
  imageSrc,
  altText,
  className = "",
  background,
}) => {
  const sectionRef = useRef(null);
  const hoverRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!sectionRef.current || !hoverRef.current) return;

    const rect = sectionRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    hoverRef.current.style.setProperty("--mouse-x", `${x}%`);
    hoverRef.current.style.setProperty("--mouse-y", `${y}%`);
    hoverRef.current.style.setProperty("--opacity", "0.8");
  };

  const handleMouseLeave = () => {
    if (hoverRef.current) {
      hoverRef.current.style.setProperty("--opacity", "0");
    }
  };

  return (
    <div
      ref={sectionRef}
      className={`hover-section ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {background ? (
        <div className="section-bg absolute inset-0 w-full h-full z-1">
          {background}
        </div>
      ) : (
        imageSrc && (
          <img
            src={imageSrc}
            alt={altText || "Background"}
            className="section-bg"
          />
        )
      )}
      <div ref={hoverRef} className="hover-effect" />
      <div className="section-content">{children}</div>
    </div>
  );
};

export default HoverWrapper;
