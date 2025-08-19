'use client';

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { isPremium } from '@/lib/premium';
import { useAuth } from '@/components/auth/AuthProvider';

interface DragDropContextType {
  isDragging: boolean;
  draggedStreamId: string | null;
  dragOverStreamId: string | null;
  canDrag: boolean;
  startDrag: (streamId: string, event: React.DragEvent) => void;
  endDrag: () => void;
  handleDragOver: (streamId: string, event: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (targetStreamId: string, event: React.DragEvent) => void;
  onStreamReorder?: (fromStreamId: string, toStreamId: string) => void;
}

const DragDropContext = createContext<DragDropContextType>({
  isDragging: false,
  draggedStreamId: null,
  dragOverStreamId: null,
  canDrag: false,
  startDrag: () => {},
  endDrag: () => {},
  handleDragOver: () => {},
  handleDragLeave: () => {},
  handleDrop: () => {},
});

export const useDragDrop = () => useContext(DragDropContext);

interface DragDropProviderProps {
  children: React.ReactNode;
  onStreamReorder?: (fromStreamId: string, toStreamId: string) => void;
}

export function DragDropProvider({ children, onStreamReorder }: DragDropProviderProps) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [draggedStreamId, setDraggedStreamId] = useState<string | null>(null);
  const [dragOverStreamId, setDragOverStreamId] = useState<string | null>(null);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const canDrag = isPremium(user);

  const startDrag = useCallback((streamId: string, event: React.DragEvent) => {
    if (!canDrag) {
      event.preventDefault();
      return;
    }
    
    setIsDragging(true);
    setDraggedStreamId(streamId);
    
    // Set drag effect
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', streamId);
    
    // Add a slight delay to prevent accidental drags
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
  }, [canDrag]);

  const endDrag = useCallback(() => {
    setIsDragging(false);
    setDraggedStreamId(null);
    setDragOverStreamId(null);
    
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }
  }, []);

  const handleDragOver = useCallback((streamId: string, event: React.DragEvent) => {
    if (!canDrag || !isDragging || streamId === draggedStreamId) {
      return;
    }
    
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverStreamId(streamId);
  }, [canDrag, isDragging, draggedStreamId]);

  const handleDragLeave = useCallback(() => {
    setDragOverStreamId(null);
  }, []);

  const handleDrop = useCallback((targetStreamId: string, event: React.DragEvent) => {
    event.preventDefault();
    
    if (!canDrag || !draggedStreamId || targetStreamId === draggedStreamId) {
      endDrag();
      return;
    }
    
    const sourceStreamId = event.dataTransfer.getData('text/plain');
    
    if (sourceStreamId && sourceStreamId !== targetStreamId && onStreamReorder) {
      onStreamReorder(sourceStreamId, targetStreamId);
    }
    
    endDrag();
  }, [canDrag, draggedStreamId, onStreamReorder, endDrag]);

  const contextValue: DragDropContextType = {
    isDragging,
    draggedStreamId,
    dragOverStreamId,
    canDrag,
    startDrag,
    endDrag,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    onStreamReorder,
  };

  return (
    <DragDropContext.Provider value={contextValue}>
      {children}
    </DragDropContext.Provider>
  );
}

// Hook for making stream containers draggable
export function useDraggableStream(streamId: string) {
  const { 
    isDragging, 
    draggedStreamId, 
    dragOverStreamId, 
    canDrag, 
    startDrag, 
    endDrag, 
    handleDragOver, 
    handleDragLeave, 
    handleDrop 
  } = useDragDrop();

  const isBeingDragged = draggedStreamId === streamId;
  const isDropTarget = dragOverStreamId === streamId;
  const isOtherBeingDragged = isDragging && !isBeingDragged;

  const dragProps = canDrag ? {
    draggable: true,
    onDragStart: (event: React.DragEvent) => startDrag(streamId, event),
    onDragEnd: endDrag,
    onDragOver: (event: React.DragEvent) => handleDragOver(streamId, event),
    onDragLeave: handleDragLeave,
    onDrop: (event: React.DragEvent) => handleDrop(streamId, event),
  } : {
    draggable: false,
  };

  const dragClasses = {
    container: `
      ${canDrag ? 'cursor-move' : ''}
      ${isBeingDragged ? 'opacity-50 scale-95 z-50' : ''}
      ${isDropTarget ? 'ring-2 ring-[#9146FF] ring-opacity-50' : ''}
      ${isOtherBeingDragged ? 'transition-all duration-200' : ''}
      transition-all duration-200
    `,
    dragHandle: canDrag ? `
      absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100
      bg-black/50 hover:bg-black/70 rounded p-1 transition-all
      cursor-grab active:cursor-grabbing
    ` : 'hidden',
  };

  return {
    dragProps,
    dragClasses,
    isDraggable: canDrag,
    isBeingDragged,
    isDropTarget,
    isOtherBeingDragged,
  };
}