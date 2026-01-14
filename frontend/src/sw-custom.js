import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, setDefaultHandler, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';

self.skipWaiting();
clientsClaim();

// Precache all build assets injected by Vite
precacheAndRoute(self.__WB_MANIFEST);

// ------------------------
// 1️⃣ Never cache /api/auth
// ------------------------
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/auth'),
  new NetworkOnly()
);

// ------------------------
// 2️⃣ Optional: cache static assets (JS/CSS/images) for offline
// ------------------------
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// ------------------------
// 3️⃣ Navigation fallback for SPA
// ------------------------
const navigationHandler = async ({ request }) => {
  const cached = await caches.match('index.html');
  return cached || fetch(request);
}

registerRoute(new NavigationRoute(navigationHandler));

// ------------------------
// 4️⃣ Default handler: network first
// ------------------------
setDefaultHandler(new NetworkOnly());
