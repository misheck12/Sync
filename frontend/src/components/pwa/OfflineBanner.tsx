import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

export const OfflineBanner = () => {
    const { isOnline } = useNetworkStatus();
    const [showReconnected, setShowReconnected] = useState(false);
    const [wasEverOffline, setWasEverOffline] = useState(false);

    useEffect(() => {
        if (!isOnline) {
            setWasEverOffline(true);
        } else if (wasEverOffline) {
            setShowReconnected(true);
            const timer = setTimeout(() => {
                setShowReconnected(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, wasEverOffline]);

    if (isOnline && !showReconnected) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${isOnline
                    ? 'bg-green-600'
                    : 'bg-amber-500'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-white text-sm font-medium">
                {isOnline ? (
                    <>
                        <Wifi size={16} />
                        <span>Back online!</span>
                    </>
                ) : (
                    <>
                        <WifiOff size={16} />
                        <span>You're offline. Some features may be limited.</span>
                    </>
                )}
            </div>
        </div>
    );
};

export default OfflineBanner;
