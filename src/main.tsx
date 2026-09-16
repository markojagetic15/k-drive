import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import PrivacyPolicy from './PrivacyPolicy.tsx'
import Admin from './admin/Admin.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { LanguageProvider } from './context/LanguageContext.tsx'
import { ContentProvider } from './context/ContentContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ThemeProvider storageKey="k-drive-theme">
              <LanguageProvider>
                <ContentProvider>
                  <App />
                </ContentProvider>
              </LanguageProvider>
            </ThemeProvider>
          }
        />
        <Route
          path="/privatnost"
          element={
            <ThemeProvider storageKey="k-drive-theme">
              <LanguageProvider>
                <ContentProvider>
                  <PrivacyPolicy />
                </ContentProvider>
              </LanguageProvider>
            </ThemeProvider>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ThemeProvider storageKey="k-drive-admin-theme">
              <Admin />
            </ThemeProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
