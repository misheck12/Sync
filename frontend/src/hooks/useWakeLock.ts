import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Wake Lock Hook
 * Prevents device screen from dimming/sleeping during critical operations
 * Useful for: Payment flows, form submissions, data exports
 */
export const useWakeLock = () => {
    const [isLocked, setIsLocked] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    useEffect(() => {
        setIsSupported('wakeLock' in navigator);
    }, []);

    const requestWakeLock = useCallback(async () => {
        if (!isSupported) {
            console.warn('Wake Lock API not supported');
            return false;
        }

        try {
            wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
            setIsLocked(true);

            // Handle automatic release
            wakeLockRef.current.addEventListener('release', () => {
                setIsLocked(false);
                console.log('Wake Lock released');
            });

            console.log('Wake Lock acquired');
            return true;
        } catch (error) {
            console.error('Failed to acquire Wake Lock:', error);
            setIsLocked(false);
            return false;
        }
    }, [isSupported]);

    const releaseWakeLock = useCallback(async () => {
        if (wakeLockRef.current) {
            try {
                await wakeLockRef.current.release();
                wakeLockRef.current = null;
                setIsLocked(false);
                console.log('Wake Lock released manually');
                return true;
            } catch (error) {
                console.error('Failed to release Wake Lock:', error);
                return false;
            }
        }
        return true;
    }, []);

    // Re-acquire wake lock when visibility changes (tab comes back to focus)
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (isLocked && document.visibilityState === 'visible') {
                await requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isLocked, requestWakeLock]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wakeLockRef.current) {
                wakeLockRef.current.release();
            }
        };
    }, []);

    return { isSupported, isLocked, requestWakeLock, releaseWakeLock };
};

// TypeScript type for Wake Lock
interface WakeLockSentinel extends EventTarget {
    readonly released: boolean;
    readonly type: 'screen';
    release(): Promise<void>;
}

export default useWakeLock;
