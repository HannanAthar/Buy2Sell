export const measureComponentRender = (componentName) => {
  if (import.meta.env.DEV) {
    const start = performance.now();
    return () => {
      const end = performance.now();
      const duration = end - start;
      if (duration > 16) {
        console.warn(`[Slow Render] ${componentName} took ${duration.toFixed(2)}ms`);
      }
    };
  }
  return () => {};
};

export const onCLS = (metric) => {
  console.log(metric.name, metric.value);
};

export const onFID = (metric) => {
  console.log(metric.name, metric.value);
};

export const onLCP = (metric) => {
  console.log(metric.name, metric.value);
};
