// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthContextProvider } from "./context/AuthContext.jsx";
import { router } from "./router.jsx";
import "./index.css";

// Import the other providers you need
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create the query client
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <AuthContextProvider>
                    {/* These components are for notifications */}
                    <Toaster />
                    <Sonner />

                    {/* This renders your entire application based on the router file */}
                    <RouterProvider router={router} />
                </AuthContextProvider>
            </TooltipProvider>
        </QueryClientProvider>
    </React.StrictMode>
);
