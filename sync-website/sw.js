
// This service worker replaces the React app's service worker
// and immediately unregisters itself to clear the cache.

self.addEventListener('install', (event) => {
    console.log('Installing cleanup service worker...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Activating cleanup service worker...');

    // Unregister this service worker immediately
    self.registration.unregister()
        .then(() => {
            console.log('Service Worker unregistered.');
            // Take control of all clients to force reload if needed
            return self.clients.matchAll();
        })
        .then((clients) => {
            clients.forEach(client => {
                // Optional: force reload
                // client.navigate(client.url);
                console.log('Cleaned up client:', client.url);
            });
        });
});
