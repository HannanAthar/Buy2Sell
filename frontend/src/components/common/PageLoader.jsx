import React from 'react';

const PageLoader = () => (
  <div className="w-full max-w-7xl mx-auto px-4 py-8 animate-pulse">
    {/* Header Skeleton */}
    <div className="h-16 bg-gray-200 rounded-lg mb-8 w-full"></div>
    
    {/* Hero / Banner Skeleton */}
    <div className="h-64 md:h-96 bg-gray-200 rounded-2xl mb-12 w-full"></div>
    
    {/* Content Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Sidebar / Filter Skeleton */}
      <div className="hidden md:block col-span-1 space-y-4">
        <div className="h-40 bg-gray-200 rounded-xl"></div>
        <div className="h-60 bg-gray-200 rounded-xl"></div>
      </div>
      
      {/* Main Content Area */}
      <div className="col-span-1 md:col-span-2 space-y-6">
        {/* Title & Sort Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        </div>
        
        {/* Grid Items */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <div className="h-48 bg-gray-200 rounded-xl w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default PageLoader;
