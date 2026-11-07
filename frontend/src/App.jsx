import { HashRouter, Navigate, Route, Routes } from "react-router-dom"
import { ThemeProvider } from "./context/ThemeContext.jsx"
import { ToastProvider } from "./context/ToastContext.jsx"
import { AuthProvider } from "./context/AuthContext.jsx"
import { StoreProvider } from "./hooks/useStore.jsx"
import ProtectedRoute from "./components/ProtectedRoute.jsx"
import Layout from "./components/Layout.jsx"
import Login from "./pages/Login.jsx"
import Register from "./pages/Register.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Transactions from "./pages/Transactions.jsx"
import Income from "./pages/Income.jsx"
import Accounts from "./pages/Accounts.jsx"
import Analytics from "./pages/Analytics.jsx"
import Settings from "./pages/Settings.jsx"

function PrivateApp() {
  // StoreProvider only mounts for signed-in users, so each login starts with fresh data
  // and one user's data can never linger in memory for the next.
  return (
    <StoreProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/income" element={<Income />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </StoreProvider>
  )
}

export default function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/*" element={<PrivateApp />} />
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </HashRouter>
  )
}
