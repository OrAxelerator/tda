import { type ReactNode } from "react";
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./components/AuthProvider";
import { useAuth } from "./components/auth-context";

const Login = lazy(() => import("./pages/login"));
const SignUp = lazy(() => import("./pages/SignUp"));

const Profile = lazy(() => import("./pages/Profile"));
const Home = lazy(() => import("./components/Home"));
const Game = lazy(() => import("./components/Game"));
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
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<Home />} />
                <Route path="/profile" element={<Navigate to="/user" replace />} />
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Suspense fallback={<div>Chargement de la page de connexion...</div>}>
                        <Login />
                      </Suspense>
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <Suspense fallback={<div>Chargement de la page d'inscription...</div>}>
                        <SignUp />
                      </Suspense>
                    </PublicRoute>
                  }
                />
                <Route
                  path="/user"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<div>Chargement du profil...</div>}>
                        <Profile />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user/:uid"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<div>Chargement du profil...</div>}>
                        <Profile />
                      </Suspense>
                      
                    </ProtectedRoute>
                  }
                />
                <Route path="/game" element={<Navigate to="/user" replace />} />
                <Route
                  path="/game/:roomCode"
                  element={
                    <ProtectedRoute>
                      <Suspense fallback={<div>Chargement de la partie...</div>}>
                        <Game />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/home" replace />} />
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
