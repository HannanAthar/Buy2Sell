
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Custom hook to manage filter state and synchronize it with URL query parameters.
 * @param {Object} initialState - The initial state of the filters.
 * @returns {Object} { filters, updateFilter, clearFilters, setFilters }
 */
export function useUrlFilterState(initialState) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL or defaults
  const [filters, setFilters] = useState(() => {
    const params = {};
    
    // Parse categories (comma-separated list)
    const cats = searchParams.get('categories');
    if (cats) params.categories = cats.split(',');

    // Parse price
    const min = searchParams.get('minPrice');
    const max = searchParams.get('maxPrice');
    if (min) params.priceMin = Number(min);
    if (max) params.priceMax = Number(max);

    // Parse others
    const condition = searchParams.get('condition');
    if (condition) params.condition = condition;

    const designer = searchParams.get('designer');
    if (designer) params.designer = designer;

    const onSale = searchParams.get('onSale');
    if (onSale === 'true') params.onSale = true;

    const listing = searchParams.get('listing');
    if (listing) params.listing = listing;

    // Parse gender
    const gender = searchParams.get('gender');
    if (gender) params.gender = gender; // STRING now

    // Merge with defaults
    return { ...initialState, ...params };
  });

  // Effect: Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    // Categories
    if (filters.categories && filters.categories.length > 0) {
      params.set('categories', filters.categories.join(','));
    } else {
      params.delete('categories');
    }

    // Gender - Single String
    if (filters.gender) {
      params.set('gender', filters.gender);
    } else {
      params.delete('gender');
    }

    // Price
    if (filters.priceMin !== undefined && filters.priceMin !== initialState.priceMin) {
      params.set('minPrice', filters.priceMin);
    } else {
      params.delete('minPrice');
    }
    if (filters.priceMax !== undefined && filters.priceMax !== initialState.priceMax) {
      params.set('maxPrice', filters.priceMax);
    } else {
      params.delete('maxPrice');
    }

    // Condition
    if (filters.condition) {
      params.set('condition', filters.condition);
    } else {
      params.delete('condition');
    }

    // Designer
    if (filters.designer) {
      params.set('designer', filters.designer);
    } else {
      params.delete('designer');
    }
    
    // Listing Type
    if (filters.listing && filters.listing !== 'any') {
      params.set('listing', filters.listing);
    } else {
      params.delete('listing');
    }

    // On Sale
    if (filters.onSale) {
      params.set('onSale', 'true');
    } else {
      params.delete('onSale');
    }
    
    // Preserve existing 'seller' param (important for mode switching)
    const seller = searchParams.get('seller');
    if(seller) params.set('seller', seller);

    // 🛑 Prevent Infinite Loop: Only update if query string actually changed
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [filters, initialState, searchParams, setSearchParams]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    // Reset to initial state, but carefully preserve structural defaults
    // Note: We might want to keep 'seller' logic outside this hook or re-inject it.
    // Ideally this hook blindly resets to `initialState`.
    setFilters(initialState);
  }, [initialState]);

  return { filters, updateFilter, clearFilters, setFilters };
}
