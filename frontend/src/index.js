import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Auth0Provider } from '@auth0/auth0-react';

// Estos valores los obtienes de la configuración de tu aplicación en Auth0
const domain = "dev-lyvcdwdxsmzfi4ng.us.auth0.com";
const clientId = "eB34oLkIVzW3wxvH2FPS4g08mimfPzHy";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      redirectUri={window.location.origin}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);

reportWebVitals();
