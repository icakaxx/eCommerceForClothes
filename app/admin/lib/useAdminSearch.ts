'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { adminSearchIndex, SearchableItem } from './adminSearchIndex';

interface RecentSearch {
  id: string;
  timestamp: number;
}

const RECENT_SEARCHES_KEY = 'admin-recent-searches';
const MAX_RECENT_SEARCHES = 10;

export function useAdminSearch() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as RecentSearch[];
          setRecentSearches(parsed);
        }
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
  }, []);

  // Handle hash-based scrolling when page loads with hash
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (!hash) return;
      
      const elementId = hash.substring(1); // Remove the #
      
      const scrollToElement = (attempts = 0) => {
        if (attempts > 30) return; // Max 30 attempts (3 seconds)
        
        const element = document.getElementById(elementId);
        
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          // Check if element is already highlighted (from previous attempt or handleSelect)
          const existingTimeout = (element as any).__highlightTimeout;
          const isAlreadyHighlighted = element.style.backgroundColor === 'rgba(128, 128, 128, 0.12)' || 
                                       element.style.backgroundColor === 'rgb(128, 128, 128)' ||
                                       window.getComputedStyle(element).backgroundColor === 'rgba(128, 128, 128, 0.12)';
          
          // If already highlighted, use stored original styles or treat as empty
          let originalBg: string;
          let originalTransition: string;
          let originalOutline: string;
          let originalOutlineOffset: string;
          
          if (isAlreadyHighlighted && (element as any).__originalStyles) {
            // Use previously saved original styles
            originalBg = (element as any).__originalStyles.backgroundColor || '';
            originalTransition = (element as any).__originalStyles.transition || '';
            originalOutline = (element as any).__originalStyles.outline || '';
            originalOutlineOffset = (element as any).__originalStyles.outlineOffset || '';
          } else {
            // Save current styles as original (only if not already highlighted)
            originalBg = element.style.backgroundColor;
            originalTransition = element.style.transition;
            originalOutline = element.style.outline;
            originalOutlineOffset = element.style.outlineOffset;
            // Store original styles on element for future reference
            (element as any).__originalStyles = {
              backgroundColor: originalBg,
              transition: originalTransition,
              outline: originalOutline,
              outlineOffset: originalOutlineOffset
            };
          }
          
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          
          element.style.transition = 'background-color 0.2s ease, outline 0.2s ease';
          element.style.backgroundColor = 'rgba(128, 128, 128, 0.12)';
          element.style.outline = '2px solid rgba(128, 128, 128, 0.3)';
          element.style.outlineOffset = '2px';
          
          const highlightTimeout = setTimeout(() => {
            // Re-fetch element in case DOM changed
            const currentElement = document.getElementById(elementId);
            if (currentElement) {
              // Explicitly clear styles - if original was empty, we need to remove the inline style
              if (originalBg) {
                currentElement.style.backgroundColor = originalBg;
              } else {
                currentElement.style.removeProperty('background-color');
              }
              
              if (originalTransition) {
                currentElement.style.transition = originalTransition;
              } else {
                currentElement.style.removeProperty('transition');
              }
              
              if (originalOutline) {
                currentElement.style.outline = originalOutline;
              } else {
                currentElement.style.removeProperty('outline');
              }
              
              if (originalOutlineOffset) {
                currentElement.style.outlineOffset = originalOutlineOffset;
              } else {
                currentElement.style.removeProperty('outline-offset');
              }
              
              delete (currentElement as any).__highlightTimeout;
              delete (currentElement as any).__originalStyles;
            }
          }, 500);
          
          // Store timeout ID on element for cleanup
          (element as any).__highlightTimeout = highlightTimeout;
        } else {
          setTimeout(() => scrollToElement(attempts + 1), 100);
        }
      };
      
      // Wait a bit for page to render, then try scrolling
      setTimeout(() => scrollToElement(), 300);
    };
    
    // Handle initial hash
    handleHashScroll();
    
    // Also listen for hash changes
    window.addEventListener('hashchange', handleHashScroll);
    
    return () => {
      window.removeEventListener('hashchange', handleHashScroll);
    };
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearches = useCallback((searches: RecentSearch[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
      } catch (error) {
        console.error('Failed to save recent searches:', error);
      }
    }
  }, []);

  // Add item to recent searches
  const addToRecent = useCallback((itemId: string) => {
    setRecentSearches((prev) => {
      // Remove if already exists
      const filtered = prev.filter((s) => s.id !== itemId);
      // Add to beginning
      const updated = [{ id: itemId, timestamp: Date.now() }, ...filtered].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      saveRecentSearches(updated);
      return updated;
    });
  }, [saveRecentSearches]);

  // Get recent search items
  const recentSearchItems = useMemo(() => {
    return recentSearches
      .map((recent) => adminSearchIndex.find((item) => item.id === recent.id))
      .filter((item): item is SearchableItem => item !== undefined)
      .slice(0, MAX_RECENT_SEARCHES);
  }, [recentSearches]);

  // Search function
  const searchItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }

    const term = searchTerm.toLowerCase().trim();
    type SearchResult = SearchableItem & { score: number };
    const results: SearchResult[] = [];

    for (const item of adminSearchIndex) {
      // Check exact matches first (highest priority)
      const titleMatch = item.title.toLowerCase() === term;
      const titleBgMatch = item.titleBg.toLowerCase() === term;
      
      // Check if title contains the term
      const titleContains = item.title.toLowerCase().includes(term);
      const titleBgContains = item.titleBg.toLowerCase().includes(term);
      
      // Check keywords
      const keywordMatch = item.keywords.some((keyword) =>
        keyword.toLowerCase().includes(term)
      );
      
      // Check description
      const descriptionMatch = item.description?.toLowerCase().includes(term);

      // Score the match
      let score = 0;
      if (titleMatch || titleBgMatch) {
        score = 100; // Exact title match
      } else if (titleContains || titleBgContains) {
        score = 80; // Title contains term
      } else if (keywordMatch) {
        score = 60; // Keyword match
      } else if (descriptionMatch) {
        score = 40; // Description match
      }

      if (score > 0) {
        results.push({ ...item, score });
      }
    }

    // Sort by score (highest first), then by type priority (page > section > header > field > action)
    const typePriority: Record<SearchableItem['type'], number> = {
      page: 5,
      section: 4,
      header: 3,
      field: 2,
      action: 1,
    };

    return results.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      return typePriority[b.type] - typePriority[a.type];
    });
  }, [searchTerm]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchableItem[]> = {
      pages: [],
      sections: [],
      fields: [],
      actions: [],
    };

    searchItems.forEach((item) => {
      if (item.type === 'page') {
        groups.pages.push(item);
      } else if (item.type === 'section' || item.type === 'header') {
        groups.sections.push(item);
      } else if (item.type === 'field') {
        groups.fields.push(item);
      } else if (item.type === 'action') {
        groups.actions.push(item);
      }
    });

    return groups;
  }, [searchItems]);

  // Handle item selection
  const handleSelect = useCallback((item: SearchableItem) => {
    addToRecent(item.id);
    setIsOpen(false);
    setSearchTerm('');
    
    // If item has a parentPath, it's a section/field/action that needs scrolling
    if (item.parentPath && item.type !== 'page') {
      // Navigate to the page with hash for the element
      const targetPath = `${item.path}#${item.id}`;
      router.push(targetPath);
      
      // After navigation, scroll to the element with the item's ID
      // Use multiple attempts to handle different page load times
      const scrollToElement = (attempts = 0) => {
        if (attempts > 20) {
          return; // Max 20 attempts (2 seconds)
        }
        
        const element = document.getElementById(item.id);
        if (element) {
          // Scroll to element smoothly
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          // Check if element is already highlighted (from previous attempt or hash useEffect)
          const existingTimeout = (element as any).__highlightTimeout;
          const isAlreadyHighlighted = element.style.backgroundColor === 'rgba(128, 128, 128, 0.12)' || 
                                       element.style.backgroundColor === 'rgb(128, 128, 128)' ||
                                       window.getComputedStyle(element).backgroundColor === 'rgba(128, 128, 128, 0.12)';
          
          // If already highlighted, use stored original styles or treat as empty
          let originalBg: string;
          let originalTransition: string;
          let originalOutline: string;
          let originalOutlineOffset: string;
          
          if (isAlreadyHighlighted && (element as any).__originalStyles) {
            // Use previously saved original styles
            originalBg = (element as any).__originalStyles.backgroundColor || '';
            originalTransition = (element as any).__originalStyles.transition || '';
            originalOutline = (element as any).__originalStyles.outline || '';
            originalOutlineOffset = (element as any).__originalStyles.outlineOffset || '';
          } else {
            // Save current styles as original (only if not already highlighted)
            originalBg = element.style.backgroundColor;
            originalTransition = element.style.transition;
            originalOutline = element.style.outline;
            originalOutlineOffset = element.style.outlineOffset;
            // Store original styles on element for future reference
            (element as any).__originalStyles = {
              backgroundColor: originalBg,
              transition: originalTransition,
              outline: originalOutline,
              outlineOffset: originalOutlineOffset
            };
          }
          
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          
          // Apply highlight styles
          element.style.transition = 'background-color 0.2s ease, outline 0.2s ease';
          element.style.backgroundColor = 'rgba(128, 128, 128, 0.12)';
          element.style.outline = '2px solid rgba(128, 128, 128, 0.3)';
          element.style.outlineOffset = '2px';
          
          // Remove highlight after 0.5 seconds
          const highlightTimeout = setTimeout(() => {
            // Re-fetch element in case DOM changed
            const currentElement = document.getElementById(item.id);
            if (currentElement) {
              // Explicitly clear styles - if original was empty, we need to remove the inline style
              if (originalBg) {
                currentElement.style.backgroundColor = originalBg;
              } else {
                currentElement.style.removeProperty('background-color');
              }
              
              if (originalTransition) {
                currentElement.style.transition = originalTransition;
              } else {
                currentElement.style.removeProperty('transition');
              }
              
              if (originalOutline) {
                currentElement.style.outline = originalOutline;
              } else {
                currentElement.style.removeProperty('outline');
              }
              
              if (originalOutlineOffset) {
                currentElement.style.outlineOffset = originalOutlineOffset;
              } else {
                currentElement.style.removeProperty('outline-offset');
              }
              
              delete (currentElement as any).__highlightTimeout;
              delete (currentElement as any).__originalStyles;
            }
          }, 500);
          
          // Store timeout ID on element for cleanup if needed
          (element as any).__highlightTimeout = highlightTimeout;
        } else {
          // Retry after a short delay
          setTimeout(() => scrollToElement(attempts + 1), 100);
        }
      };
      
      // Start scrolling after navigation - wait longer for Next.js to complete navigation
      // Next.js app router navigation is async, so we need to wait for the route to actually change
      
      // Try multiple times with increasing delays to handle Next.js navigation timing
      setTimeout(() => scrollToElement(), 300);  // Initial attempt after 300ms
      setTimeout(() => scrollToElement(), 600);  // Second attempt after 600ms
      setTimeout(() => scrollToElement(), 1000);  // Third attempt after 1 second
      
      // The hash-based useEffect hook will also handle scrolling as a fallback
    } else {
      // Regular page navigation
      router.push(item.path);
    }
  }, [addToRecent, router]);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    saveRecentSearches([]);
  }, [saveRecentSearches]);

  return {
    searchTerm,
    setSearchTerm,
    results: searchItems as SearchableItem[],
    groupedResults,
    recentSearchItems,
    isOpen,
    setIsOpen,
    handleSelect,
    clearRecentSearches,
  };
}
