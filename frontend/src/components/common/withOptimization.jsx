import React from 'react';

/**
 * Higher-Order Component to wrap components with granular React.memo()
 * 
 * @param {React.Component} Component - The component to memoize
 * @param {Function} [propsAreEqual] - Optional custom comparison function. 
 *                                     Defaults to shallow check via React.memo default.
 * @returns {React.Component} Memoized component
 */
const withOptimization = (Component, propsAreEqual) => {
  const OptimizedComponent = React.memo(Component, propsAreEqual);
  
  // Retain display name for debugging/devtools
  const componentName = Component.displayName || Component.name || 'Component';
  OptimizedComponent.displayName = `Optimized(${componentName})`;
  
  return OptimizedComponent;
};

export default withOptimization;
