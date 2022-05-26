"use strict";

const CACHE_NAME = "cache-v0.6";

const CACHED_URLS = [
    "/",
    "/index.html",
    "/manifest.json",
    "/assets/js/script.js",
    "/assets/css/reset.css",
    "/assets/css/style.css",
    "/assets/css/style.css.map",
    "/assets/css/style.scss",
    "/assets/js/reader.js",
    "/assets/js/data.js",
    "/assets/fonts/SF-Pro-Text-Regular.otf",
    "/assets/images/add-race.png",
    "/assets/images/back.png",
    "/assets/images/burger.png",
    "/assets/images/comments.png",
    "/assets/images/create-post.png",
    "/assets/images/delete.png",
    "/assets/images/f1storieslogo.png",
    "/assets/images/liked.png",
    "/assets/images/notliked.png",
    "/assets/images/open-settings.png",
    "/assets/images/share.png",
    "/assets/images/view-profile.png"
]

self.addEventListener("install",function(e){
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(CACHED_URLS)
        })
    )
})

self.addEventListener("fetch",function(e){
    e.respondWith(caches.open(CACHE_NAME).then(cache =>{
        return cache.match(e.request).then(cacheResponse => {
            return cacheResponse || fetch(e.request);
        });
    }))
})