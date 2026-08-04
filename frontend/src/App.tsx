import { type ReactNode } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./components/AuthProvider";
import { useAuth } from "./components/auth-context";
import Login from "./pages/login";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import Game from "./components/Game";
import Home from "./components/Home";
import "./App.css";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Chargement...</p>;
  }

  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Chargement...</p>;
  }

  return user ? <Navigate to="/user" replace /> : children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <div className="auth-wrapper">
            <div className="auth-inner">
              <Routes>
                <Route path="/" element={<Navigate to="/user" replace />} />
                <Route path="/profile" element={<Navigate to="/user" replace />} />
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <SignUp />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/user"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route path="/game" element={<Navigate to="/user" replace />} />
                <Route
                  path="/game/:roomCode"
                  element={
                    <ProtectedRoute>
                      <Game />
                    </ProtectedRoute>
                  }
                />
                <Route path="/home" element={<Home />} />
              </Routes>
              <ToastContainer />
            </div>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;