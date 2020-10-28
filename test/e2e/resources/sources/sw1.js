self.addEventListener('fetch', fetchEvent => {
    console.log(fetchEvent.request.url); // Should pause here.
    if (fetchEvent.request.url === 'http://localhost:3000/hello.txt') {
      fetchEvent.respondWith(new Response('<p>This is a response that comes from your service worker!</p>', {
        headers: { 'Content-Type': 'text/html' } }));
    } else {
      fetchEvent.respondWith(fetch(fetchEvent.request.url));
    }
  });
