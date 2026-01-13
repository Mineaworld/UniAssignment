import React from 'react';

/** Loading skeleton displayed while BlockNote editor loads */
export const EditorSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-3 p-4">
    <div className="h-4 bg-muted rounded w-3/4" />
    <div className="h-4 bg-muted rounded w-1/2" />
    <div className="h-4 bg-muted rounded w-5/6" />
    <div className="h-4 bg-muted rounded w-2/3" />
  </div>
);
