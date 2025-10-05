// src/router.jsx
import { createBrowserRouter } from "react-router-dom";
import AuthCallback from "./pages/AuthCallback";

// --- Import your final page components ---
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage"; // The single page for login/signup
import Dashboard from "./routes/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import HistoryView from "./pages/HistoryView";
import HistoryList from "./components/HistoryList";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
    // --- Public Routes ---
    {
        path: "/",
        element: <Index />, // Correct: Public landing page
    },
    {
        path: "/auth",
        element: <AuthPage />, // Correct: Single page for both login and signup
    },
    {
        path: "/auth/callback",
        element: <AuthCallback />,
    },

    // --- Protected Routes ---
    {
        path: "/dashboard",
        element: (
            <PrivateRoute>
                <Dashboard />
            </PrivateRoute>
        ),
    },
    {
        path: "/history",
        element: (
            <PrivateRoute>
                <HistoryList />
            </PrivateRoute>
        ),
    },
    {
        path: "/history/:id",
        element: (
            <PrivateRoute>
                <HistoryView />
            </PrivateRoute>
        ),
    },

    // --- Catch-all Route for 404 errors ---
    {
        path: "*",
        element: <NotFound />,
    },
]);
