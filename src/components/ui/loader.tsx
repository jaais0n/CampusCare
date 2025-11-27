import React from 'react';
import { HeartPulse } from 'lucide-react';

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
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md z-50'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={`${containerClasses} ${className}`}>
      {/* Three bouncing dots */}
      <div className="flex items-center gap-1.5">
        <div className={`${dotSize[size]} bg-primary rounded-full animate-bounce [animation-delay:-0.3s]`}></div>
        <div className={`${dotSize[size]} bg-primary rounded-full animate-bounce [animation-delay:-0.15s]`}></div>
        <div className={`${dotSize[size]} bg-primary rounded-full animate-bounce`}></div>
      </div>
      {text && (
        <p className="mt-4 text-sm text-muted-foreground">
          {text}
        </p>
      )}
    </div>
  );
};

// Skeleton loader for cards - clean without borders
export const SkeletonCard = () => (
  <div className="rounded-xl bg-card/50 backdrop-blur-sm p-5 space-y-4">
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 bg-muted/40 rounded-xl animate-pulse"></div>
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-muted/40 rounded-full w-3/4 animate-pulse"></div>
        <div className="h-3 bg-muted/30 rounded-full w-1/2 animate-pulse [animation-delay:0.1s]"></div>
      </div>
    </div>
    <div className="space-y-2.5">
      <div className="h-3 bg-muted/30 rounded-full w-full animate-pulse [animation-delay:0.2s]"></div>
      <div className="h-3 bg-muted/30 rounded-full w-4/5 animate-pulse [animation-delay:0.3s]"></div>
    </div>
    <div className="flex justify-between items-center pt-2">
      <div className="h-6 bg-muted/40 rounded-full w-20 animate-pulse [animation-delay:0.4s]"></div>
      <div className="h-9 bg-primary/20 rounded-full w-28 animate-pulse [animation-delay:0.5s]"></div>
    </div>
  </div>
);

// Page loader component - clean blur style
export const PageLoader = ({ text = 'Loading...' }: { text?: string }) => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-lg z-50">
    {/* Pulsing logo */}
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-2xl animate-pulse"></div>
      <div className="relative flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl">
        <HeartPulse className="w-8 h-8 text-primary animate-pulse" />
      </div>
    </div>
    
    {/* Bouncing dots */}
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"></div>
    </div>
    
    <p className="mt-5 text-muted-foreground text-sm">
      {text}
    </p>
  </div>
);

export default Loader;