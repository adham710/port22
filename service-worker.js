// Simple offline cache for static assets
const CACHE = 'CHERI-adv-cache-v1';
const ASSETS = [
  './',
  './index.html','./shop.html','./new.html','./sale.html','./about.html','./contact.html','./policy.html','./cart.html','./checkout.html','./wishlist.html','./admin.html',
  './styles.css','./app.js','./config.js','./manifest.json',
  './images/prod1.svg','./images/prod2.svg','./images/prod3.svg','./images/prod4.svg',
  './images/prod5.svg','./images/prod6.svg','./images/prod7.svg','./images/prod8.svg',
  './images/prod9.svg','./images/prod10.svg','./images/prod11.svg','./images/prod12.svg'
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=> Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
});
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});
