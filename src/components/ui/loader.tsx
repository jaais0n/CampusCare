import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({ 
  size = 'md', 
  text, 
  fullScreen = false,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={`${containerClasses} ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-primary animate-spin`} />
      {text && (
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

// Skeleton loader for cards
export const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="bg-muted rounded-lg p-4 space-y-3">
      <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
      <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
      <div className="h-3 bg-muted-foreground/20 rounded w-2/3"></div>
    </div>
  </div>
);

// Page loader component
export const PageLoader = ({ text = 'Loading...' }: { text?: string }) => (
  <Loader fullScreen size="lg" text={text} />
);

export default Loader;