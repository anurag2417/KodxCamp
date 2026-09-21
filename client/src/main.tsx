import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/app/App';
import { AppProviders } from '@/app/providers';
import { ErrorBoundary } from '@/shared/components/layout/ErrorBoundary';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </ErrorBoundary>
  </React.StrictMode>
);
