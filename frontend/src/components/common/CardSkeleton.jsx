import React from "react";

const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-md h-full flex flex-col overflow-hidden animate-pulse border border-gray-100">
      <div className="h-72 bg-gray-200 w-full shrink-0" />
      <div className="p-5 flex flex-col flex-1 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="mt-auto flex justify-between items-end">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-10 w-10 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default CardSkeleton;
