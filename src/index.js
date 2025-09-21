import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter for routing
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import App from './App'; // Import the main App component
import './index.css'; // Import your custom styles
import StoreContextProvider from './StoreContext/StoreContext'; 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <StoreContextProvider>
        <App />
      </StoreContextProvider>
    </BrowserRouter>
  </StrictMode>
);
