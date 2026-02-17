import { createContext, useContext, useState, useEffect } from "react";
import { sliderService } from "../services/SliderService";

const SliderContext = createContext();

export const useSlider = () => {
  const context = useContext(SliderContext);
  if (!context) {
    throw new Error("useSlider must be used within SliderProvider");
  }
  return context;
};

export const SliderProvider = ({ children }) => {
  // Initialize with current state from service
  const [state, setState] = useState(sliderService.getState());

  useEffect(() => {
    // Subscribe to global service updates
    // This timer runs outside of React, so unmounting components won't reset it
    const unsubscribe = sliderService.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  return (
    <SliderContext.Provider value={state}>{children}</SliderContext.Provider>
  );
};
