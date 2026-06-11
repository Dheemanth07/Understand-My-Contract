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
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Create the query client
const queryClient = new QueryClient();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <AuthContextProvider>
                    {/* These components are for notifications */}
                    <Toaster />
                    <Sonner />

                    {/* This renders your entire application based on the router file */}
                    <Analytics />
                    <SpeedInsights />
                    <RouterProvider router={router} />
                </AuthContextProvider>
            </TooltipProvider>
        </QueryClientProvider>
    </React.StrictMode>,
);
