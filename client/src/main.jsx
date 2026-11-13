import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PatientApp from './patient/PatientApp.jsx';
import Portal from './portal/Portal.jsx';
import { Toasts } from './lib/ui.jsx';
import './styles.css';

createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/optometrist" element={<Portal />} />
        <Route path="/optometrist/p/:id" element={<Portal />} />
        <Route path="*" element={<PatientApp />} />
      </Routes>
      <Toasts />
    </BrowserRouter>
  </React.StrictMode>,
);
