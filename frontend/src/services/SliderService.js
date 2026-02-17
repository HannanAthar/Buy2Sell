// Singleton slider service - persistent globally
class SliderService {
  constructor() {
    this.images = ["/1.jpg", "/10.jpg", "/15.webp", "/35.jpg"];
    this.currentImage = 0;
    this.listeners = new Set();
    this.interval = null;
    this.startTimer();
  }

  startTimer() {
    if (this.interval) return;
    // 2.5 second interval
    this.interval = setInterval(() => {
      this.currentImage = (this.currentImage + 1) % this.images.length;
      this.notify();
    }, 2500); 
  }

  subscribe(listener) {
    this.listeners.add(listener);
    // Send immediate state
    listener({ images: this.images, currentImage: this.currentImage });
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify() {
    const state = {
      images: this.images,
      currentImage: this.currentImage
    };
    this.listeners.forEach(listener => listener(state));
  }

  getState() {
    return {
      images: this.images,
      currentImage: this.currentImage
    };
  }
}

// Create single instance
export const sliderService = new SliderService();
