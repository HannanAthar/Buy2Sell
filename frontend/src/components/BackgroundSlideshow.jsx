import { useState, useEffect } from 'react';

const BackgroundSlideshow = ({ images, interval = 2000 }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="absolute inset-0 w-full h-full">
      {images.map((image, index) => (
        <div
          key={image}
          className="absolute inset-0 w-full h-full transition-opacity duration-1000 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${image})`,
            opacity: index === currentImageIndex ? 1 : 0,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-black/50" /> {/* Overlay */}
    </div>
  );
};

export default BackgroundSlideshow;