import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.tsx'

// No <StrictMode> here on purpose: react-oidc-context's AuthProvider
// exchanges Keycloak's authorization code exactly once, in an effect.
// StrictMode deliberately double-invokes effects in dev, and the code is
// single-use — the second exchange fails (code already redeemed), which
// can leave auth state inconsistent even though the first one succeeded.
// This is a documented react-oidc-context/StrictMode incompatibility, not
// something worth working around per-component.
createRoot(document.getElementById('root')!).render(<App />)
