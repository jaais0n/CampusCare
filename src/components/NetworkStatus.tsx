import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-hide the "back online" message after 3 seconds
  useEffect(() => {
    if (isOnline && !showOffline) {
      const timer = setTimeout(() => {
        setShowOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOffline]);

  if (!showOffline && isOnline) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-50 px-4 pointer-events-none">
      <Alert
        variant={isOnline ? 'default' : 'destructive'}
        className="max-w-md mx-auto shadow-lg border-2 pointer-events-auto animate-in slide-in-from-top-5"
      >
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <AlertDescription className="font-medium">
            {isOnline
              ? 'Back online! Your changes will sync now.'
              : 'No internet connection. Some features may be limited.'}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
};

export default NetworkStatus;
