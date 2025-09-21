import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import HistoryList from "./components/HistoryList";
import DocumentComparison from "./components/DocumentComparison";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                <Routes>
                    {/* Route 1: The main page that handles uploads and shows results. */}
                    <Route path="/" element={<Index />} />

                    {/* Route 2: A page to show the list of all past documents. */}
                    <Route path="/history" element={<HistoryList />} />

                    {/* Route 3: A page to show the detailed view of a specific document from history.
                        This reuses your DocumentComparison component, which would need to be
                        updated in the future to fetch data based on the URL's :id parameter.
                    */}
                    <Route
                        path="/history/:id"
                        element={<DocumentComparison />}
                    />

                    {/* Route 4: A catch-all for any routes that don't exist. */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
