'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subheader?: string;
  children: React.ReactNode;
  maxWidth?: string;
  minWidth?: number;
  minHeight?: number;
}

export default function AdminModal({
  isOpen,
  onClose,
  title,
  subheader,
  children,
  maxWidth = 'max-w-2xl',
  minWidth = 320,
  minHeight = 200,
}: AdminModalProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [showHandles, setShowHandles] = useState({ top: false, right: false, bottom: false, left: false, corners: false });
  const modalRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const proximityThreshold = 20; // pixels from edge to show handles

  // Initialize size on mount and when modal opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      setSize({
        width: Math.max(minWidth, rect.width || 600),
        height: Math.max(minHeight, rect.height || 400),
      });
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, minWidth, minHeight]);

  // Handle window resize
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      if (modalRef.current) {
        const rect = modalRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Ensure modal doesn't exceed viewport
        const maxWidth = Math.min(viewportWidth - 32, size.width);
        const maxHeight = Math.min(viewportHeight - 32, size.height);

        setSize({
          width: Math.max(minWidth, maxWidth),
          height: Math.max(minHeight, maxHeight),
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, size.width, size.height, minWidth, minHeight]);

  const handleMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      startPosRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
      };
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !modalRef.current) return;

    const deltaX = e.clientX - startPosRef.current.x;
    const deltaY = e.clientY - startPosRef.current.y;

    let newWidth = startPosRef.current.width;
    let newHeight = startPosRef.current.height;

    // Handle different resize directions
    if (resizeDirection.includes('right')) {
      newWidth = Math.max(minWidth, Math.min(window.innerWidth - 32, startPosRef.current.width + deltaX));
    }
    if (resizeDirection.includes('left')) {
      newWidth = Math.max(minWidth, Math.min(window.innerWidth - 32, startPosRef.current.width - deltaX));
    }
    if (resizeDirection.includes('bottom')) {
      newHeight = Math.max(minHeight, Math.min(window.innerHeight - 32, startPosRef.current.height + deltaY));
    }
    if (resizeDirection.includes('top')) {
      newHeight = Math.max(minHeight, Math.min(window.innerHeight - 32, startPosRef.current.height - deltaY));
    }

    setSize({ width: newWidth, height: newHeight });
  }, [isResizing, resizeDirection, minWidth, minHeight]);

  const handleMouseUp = useCallback((e?: MouseEvent) => {
    setIsResizing(false);
    setResizeDirection('');
  }, []);

  // Handle proximity detection for resize handles
  const handleMouseMoveProximity = useCallback((e: MouseEvent) => {
    if (!modalRef.current || isResizing) return;

    const rect = modalRef.current.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Calculate distances from edges
    const distFromTop = mouseY - rect.top;
    const distFromBottom = rect.bottom - mouseY;
    const distFromLeft = mouseX - rect.left;
    const distFromRight = rect.right - mouseX;

    // Check if cursor is within modal bounds
    const isInsideModal = mouseX >= rect.left && mouseX <= rect.right && 
                          mouseY >= rect.top && mouseY <= rect.bottom;

    if (isInsideModal) {
      // Show handles when cursor is near edges
      setShowHandles({
        top: distFromTop <= proximityThreshold,
        right: distFromRight <= proximityThreshold,
        bottom: distFromBottom <= proximityThreshold,
        left: distFromLeft <= proximityThreshold,
        corners: (distFromTop <= proximityThreshold || distFromBottom <= proximityThreshold) &&
                 (distFromLeft <= proximityThreshold || distFromRight <= proximityThreshold)
      });
    } else {
      // Hide handles when cursor leaves modal
      setShowHandles({ top: false, right: false, bottom: false, left: false, corners: false });
    }
  }, [isResizing, proximityThreshold]);

  useEffect(() => {
    if (isResizing) {
      const mouseUpHandler = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleMouseUp(e);
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', mouseUpHandler, true); // Use capture phase
      document.body.style.cursor = resizeDirection.includes('n') || resizeDirection.includes('s')
        ? 'ns-resize'
        : resizeDirection.includes('e') || resizeDirection.includes('w')
        ? 'ew-resize'
        : 'nwse-resize';
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', mouseUpHandler, true);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.style.pointerEvents = '';
      };
    } else {
      // Reset pointer events when not resizing
      document.body.style.pointerEvents = '';
    }
  }, [isResizing, resizeDirection, handleMouseMove, handleMouseUp]);

  // Add proximity detection when modal is open
  useEffect(() => {
    if (!isOpen || isResizing) return;

    document.addEventListener('mousemove', handleMouseMoveProximity);
    return () => {
      document.removeEventListener('mousemove', handleMouseMoveProximity);
    };
  }, [isOpen, isResizing, handleMouseMoveProximity]);

  if (!isOpen) return null;

  const modalStyle: React.CSSProperties = {
    width: size.width > 0 ? `${size.width}px` : 'auto',
    height: size.height > 0 ? `${size.height}px` : 'auto',
    minWidth: `${minWidth}px`,
    minHeight: `${minHeight}px`,
    maxWidth: '95vw',
    maxHeight: '95vh',
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isResizing) {
          onClose();
        }
      }}
      onMouseDown={(e) => {
        // Prevent backdrop clicks during or right after resize
        if (isResizing) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-2xl flex flex-col ${maxWidth} overflow-hidden relative`}
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Blue with white text */}
        <div className="bg-blue-600 text-white px-4 sm:px-6 py-4 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {title}
              </h2>
              {subheader && (
                <p className="text-xs sm:text-sm text-blue-100 mt-1">
                  {subheader}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-blue-700 rounded transition-colors touch-manipulation flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>

        {/* Resize Handles - Visible only when cursor is near edges */}
        {showHandles.corners && (
          <>
            <div
              className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize bg-blue-700 opacity-30 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'top-left')}
              style={{ zIndex: 50 }}
            />
            <div
              className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize bg-blue-700 opacity-30 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'top-right')}
              style={{ zIndex: 50 }}
            />
            <div
              className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize bg-blue-700 opacity-30 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
              style={{ zIndex: 50 }}
            />
            <div
              className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize bg-blue-700 opacity-30 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
              style={{ zIndex: 50 }}
            />
          </>
        )}
        {showHandles.top && (
          <div
            className="absolute top-0 left-3 right-3 h-2 cursor-ns-resize bg-blue-700 opacity-30 hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleMouseDown(e, 'top')}
            style={{ zIndex: 50 }}
          />
        )}
        {showHandles.bottom && (
          <div
            className="absolute bottom-0 left-3 right-3 h-2 cursor-ns-resize bg-blue-700 opacity-30 hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleMouseDown(e, 'bottom')}
            style={{ zIndex: 50 }}
          />
        )}
        {showHandles.left && (
          <div
            className="absolute left-0 top-3 bottom-3 w-2 cursor-ew-resize bg-blue-700 opacity-30 hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleMouseDown(e, 'left')}
            style={{ zIndex: 50 }}
          />
        )}
        {showHandles.right && (
          <div
            className="absolute right-0 top-3 bottom-3 w-2 cursor-ew-resize bg-blue-700 opacity-30 hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleMouseDown(e, 'right')}
            style={{ zIndex: 50 }}
          />
        )}
      </div>
    </div>
  );
}
