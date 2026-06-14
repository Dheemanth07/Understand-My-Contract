// src/components/HistoryList.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, ChevronRight } from "lucide-react";
import { API_BASE_URL } from "@/config";
import Header from "./Header";
import Footer from "./Footer";

interface HistoryItem {
    id: string;
    filename: string;
    createdAt: string;
}

export default function HistoryList() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await supabase.auth.getSession();
                const token = data.session?.access_token;

                if (!token) {
                    setError("You must be logged in to view history.");
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/history`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error("Failed to fetch history");

                const dataJson = await response.json();
                setHistory(dataJson);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-xs animate-pulse">
                        Loading your document history...
                    </p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center text-rose-600 py-16 bg-white border border-slate-200 rounded-lg shadow-sm">
                    {error || "Something went wrong while fetching history."}
                </div>
            );
        }

        if (history.length === 0) {
            return (
                <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-lg space-y-3 shadow-sm">
                    <p className="text-slate-600 font-semibold text-sm">
                        No previous documents found.
                    </p>
                    <p className="text-xs text-slate-400">
                        Upload your first document to get started.
                    </p>
                    <Button onClick={() => navigate("/dashboard")} className="bg-blue-600 hover:bg-blue-700 text-white rounded-md h-9 text-xs shadow-sm">
                        Go to Dashboard
                    </Button>
                </div>
            );
        }

        return (
            <div className="grid gap-3.5">
                {history.map((item) => (
                    <Card
                        key={item.id}
                        className="p-4 flex justify-between items-center bg-white border border-slate-200 hover:border-slate-350 hover:shadow-md transition cursor-pointer rounded-lg group shadow-sm"
                        onClick={() => navigate(`/history/${item.id}`)}
                    >
                        <div className="flex items-center gap-4 min-w-0 pr-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-xs text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                    {item.filename}
                                </p>
                                <div className="flex items-center text-[10px] text-slate-400 gap-1 mt-0.5 font-medium">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>
                                        {new Date(item.createdAt).toLocaleString("en-IN", {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-900 text-slate-700 h-8 rounded-md text-xs gap-1 shadow-sm font-semibold"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/history/${item.id}`);
                            }}
                        >
                            View
                            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                        </Button>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-700 font-sans flex flex-col justify-between">
            <Header />
            <main className="flex-1 max-w-3xl w-full mx-auto px-6 pt-24 pb-16 space-y-6">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    Your Document History
                </h2>
                {renderContent()}
            </main>
            <Footer />
        </div>
    );
}
