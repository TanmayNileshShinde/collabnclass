import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App';
import './index.css';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import 'react-datepicker/dist/react-datepicker.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const rootElement = document.getElementById('root')!;

if (!PUBLISHABLE_KEY) {
  ReactDOM.createRoot(rootElement).render(
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black p-6 text-center text-white">
      <div className="max-w-md rounded-2xl border border-red-500/20 bg-neutral-900 p-8 shadow-2xl">
        <h1 className="text-xl font-bold text-red-400 mb-2">Configuration Required</h1>
        <p className="text-sm text-neutral-300 mb-4">
          Missing Clerk Publishable Key. Please create a <code className="bg-neutral-800 px-1 py-0.5 rounded text-amber-300">frontend/.env</code> file and add:
        </p>
        <pre className="rounded bg-black p-3 text-left font-mono text-xs text-emerald-400 overflow-x-auto">
          VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
        </pre>
      </div>
    </div>
  );
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider>
        <ClerkProvider
          publishableKey={PUBLISHABLE_KEY}
          appearance={{
            layout: {
              socialButtonsVariant: 'iconButton',
              logoImageUrl: '/icons/logo.png',
            },
            variables: {
              colorText: '#fff',
              colorPrimary: '#00B4D8',
              colorBackground: '#040e1c',
              colorInputBackground: '#071529',
              colorInputText: '#fff',
              borderRadius: '0.875rem',
              fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            },
          }}
        >
          <App />
        </ClerkProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}
