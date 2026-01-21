import { useCallback, useEffect } from 'react';

/**
 * Hook for managing the app badge (notification count on icon)
 */
export const useBadge = () => {
    const isSupported = 'setAppBadge' in navigator;

    /**
     * Set the badge count
     */
    const setBadge = useCallback(async (count: number) => {
        if (!isSupported) return;

        try {
            if (count > 0) {
                await (navigator as any).setAppBadge(count);
            } else {
                await (navigator as any).clearAppBadge();
            }

            // Also notify service worker
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SET_BADGE',
                    count,
                });
            }
        } catch (error) {
            console.error('Failed to set badge:', error);
        }
    }, [isSupported]);

    /**
     * Clear the badge
     */
    const clearBadge = useCallback(async () => {
        if (!isSupported) return;

        try {
            await (navigator as any).clearAppBadge();

            // Also notify service worker
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CLEAR_BADGE',
                });
            }
        } catch (error) {
            console.error('Failed to clear badge:', error);
        }
    }, [isSupported]);

    return { isSupported, setBadge, clearBadge };
};

/**
 * Hook for registering periodic background sync
 */
export const usePeriodicSync = () => {
    const registerPeriodicSync = useCallback(async (tag: string, minIntervalMs: number) => {
        if (!('periodicSync' in (navigator as any).serviceWorker)) {
            console.warn('Periodic Background Sync not supported');
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // Check permission
            const status = await (navigator as any).permissions.query({
                name: 'periodic-background-sync',
            });

            if (status.state === 'granted') {
                await (registration as any).periodicSync.register(tag, {
                    minInterval: minIntervalMs,
                });
                console.log(`Periodic sync registered: ${tag}`);
                return true;
            } else {
                console.warn('Periodic sync permission not granted');
                return false;
            }
        } catch (error) {
            console.error('Failed to register periodic sync:', error);
            return false;
        }
    }, []);

    const unregisterPeriodicSync = useCallback(async (tag: string) => {
        try {
            const registration = await navigator.serviceWorker.ready;
            await (registration as any).periodicSync.unregister(tag);
            console.log(`Periodic sync unregistered: ${tag}`);
            return true;
        } catch (error) {
            console.error('Failed to unregister periodic sync:', error);
            return false;
        }
    }, []);

    return { registerPeriodicSync, unregisterPeriodicSync };
};

/**
 * Hook for listening to service worker messages
 */
export const useSWMessages = (onMessage: (data: any) => void) => {
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        const handleMessage = (event: MessageEvent) => {
            onMessage(event.data);
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);

        return () => {
            navigator.serviceWorker.removeEventListener('message', handleMessage);
        };
    }, [onMessage]);
};

export default useBadge;
