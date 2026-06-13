// src/router.jsx
import { createBrowserRouter } from "react-router-dom";

// --- Corrected Import Paths ---
import Index from "./pages/Index";
import SigninPage from "./pages/SigninPage";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./routes/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import HistoryView from "./pages/HistoryView";
import HistoryList from "./components/HistoryList";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
    { path: "/", element: <Index /> },
    { path: "/signin", element: <SigninPage /> },
    { path: "/signup", element: <SignupPage /> },
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
    {
        path: "*",
        element: <NotFound />,
    },
]);
