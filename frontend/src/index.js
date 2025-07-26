import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === 'POST' && request.url.endsWith('/submit')) {
    const data = await request.json();
    // Proses data faktur di sini
    return new Response(JSON.stringify({ status: 'success' }));
  }
  return new Response('Backend aktif!');
}

reportWebVitals();
