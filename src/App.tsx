import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// --- Import Pages and Components ---
import Index from "@/pages/Index";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import HistoryView from "@/pages/HistoryView";
import HistoryList from "@/components/HistoryList";
import DocumentComparison from "@/components/DocumentComparison";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                <Routes>
                    {/* 1. Public Landing Page at the root URL */}
                    <Route path="/" element={<Index />} />

                    {/* 2. Public Login Page (unchanged) */}
                    <Route path="/auth" element={<AuthPage />} />

                    {/* --- Protected Routes --- */}

                    {/* 3. Dashboard is now at a protected "/dashboard" path */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/history"
                        element={
                            <ProtectedRoute>
                                <HistoryList />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/history/:id"
                        element={
                            <ProtectedRoute>
                                <HistoryView />
                            </ProtectedRoute>
                        }
                    />

                    {/* Catch-all Route for any path that doesn't match */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
