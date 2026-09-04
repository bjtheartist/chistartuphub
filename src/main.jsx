import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

const rootElement = document.getElementById('root');

// Pre-rendered (SSG) pages ship real HTML for crawlers and first paint, but
// their content comes from live queries, so React cannot hydrate it without
// mismatches (errors #418/#423 on every data page, then a client re-render
// anyway). Render client-side on top of the pre-rendered markup instead: same
// first paint, no hydration errors.
ReactDOM.createRoot(rootElement).render(<App />);

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}



