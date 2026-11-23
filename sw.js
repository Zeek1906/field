/* Field Guide: keep the app and data available on flaky networks.
   Network first; if the network is slow (4 s), fails, or errors, serve the last good copy. */
var V = "fg-v1";
self.addEventListener("install", function(){ self.skipWaiting(); });
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k !== V; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  var u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  var key = u.origin + (u.pathname === "/" ? "/index.html" : u.pathname);
  e.respondWith(caches.open(V).then(function(c){
    return new Promise(function(res){
      var done = false;
      function useCache(fallback){ c.match(key).then(function(h){ if (done) return; if (h){ done = true; res(h); } else if (fallback){ done = true; res(fallback); } }); }
      var t = setTimeout(function(){ useCache(null); }, 4000);
      fetch(e.request).then(function(r){
        if (r && r.ok){ c.put(key, r.clone()); if (!done){ done = true; clearTimeout(t); res(r); } }
        else { clearTimeout(t); useCache(r); }
      }).catch(function(){ clearTimeout(t); useCache(Response.error()); });
    });
  }));
});
