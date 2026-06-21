import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import axios from "axios";
import { API_BASE_URL } from "@/config";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BookOpen, Search, Sparkles } from "lucide-react";
import Logo from "@/components/Logo";

export default function GlossaryPage() {
    const navigate = useNavigate();
    const { session } = UserAuth();
    const [glossary, setGlossary] = useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session) {
            fetchGlossary();
        }
    }, [session]);

    const fetchGlossary = async () => {
        if (!session?.access_token) return;
        try {
            setLoading(true);
            const resp = await axios.get(`${API_BASE_URL}/history/glossary/all`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            setGlossary(resp.data.glossary || {});
        } catch (err) {
            console.error("Failed to fetch merged glossary:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredTerms = Object.entries(glossary)
        .filter(([term, definition]) => {
            const query = searchQuery.toLowerCase();
            return (
                term.toLowerCase().includes(query) ||
                (definition && definition.toLowerCase().includes(query))
            );
        })
        .sort(([a], [b]) => a.localeCompare(b));

    // Group terms alphabetically
    const groupedTerms: Record<string, [string, string][]> = {};
    filteredTerms.forEach(([term, definition]) => {
        const letter = term.charAt(0).toUpperCase();
        if (!groupedTerms[letter]) {
            groupedTerms[letter] = [];
        }
        groupedTerms[letter].push([term, definition]);
    });

    return (
        <div className="min-h-screen bg-slate-50 text-slate-700 font-sans pb-16 relative isolate">
            <div className="max-w-5xl mx-auto px-6 pt-8 space-y-6">
                
                {/* --- HEADER --- */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                        <Logo />
                        <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                        <div>
                            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4 text-blue-600" />
                                Jargon Library
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Your personal dictionary of terms and definitions compiled across all uploaded documents.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 h-9 rounded-md px-4 gap-2 text-xs shadow-sm font-semibold"
                        onClick={() => navigate("/dashboard")}
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Studio
                    </Button>
                </header>

                {/* --- SEARCH BAR --- */}
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search terms or definitions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 bg-white border border-slate-200 shadow-sm focus-visible:ring-blue-500 focus-visible:border-blue-500 rounded-lg text-xs"
                    />
                </div>

                {/* --- GLOSSARY DISPLAY --- */}
                {loading ? (
                    <div className="space-y-8">
                        {/* Simulate 2 letter groups with 4 skeleton cards each */}
                        {[...Array(2)].map((_, groupIdx) => (
                            <div key={groupIdx} className="space-y-3">
                                {/* Letter badge skeleton */}
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-blue-100 animate-pulse" />
                                    <div className="h-px bg-slate-200 flex-1" />
                                </div>
                                {/* Card grid skeleton */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[...Array(4)].map((_, cardIdx) => (
                                        <div key={cardIdx} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-2">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-3.5 h-3.5 rounded bg-blue-100 animate-pulse shrink-0" />
                                                <div className="h-3.5 bg-slate-200 rounded animate-pulse w-1/3" />
                                            </div>
                                            <div className="space-y-1 pl-5">
                                                <div className="h-3 bg-slate-200 rounded animate-pulse w-full" />
                                                <div className="h-3 bg-slate-200 rounded animate-pulse w-5/6" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : Object.keys(glossary).length === 0 ? (
                    <Card className="p-8 text-center bg-white border border-slate-200 shadow-sm rounded-lg">
                        <BookOpen className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                        <p className="text-slate-500 font-semibold text-sm">No terms found yet.</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            Upload your first document on the dashboard. Any complex terms and definitions found will be listed here automatically.
                        </p>
                    </Card>
                ) : filteredTerms.length === 0 ? (
                    <Card className="p-8 text-center bg-white border border-slate-200 shadow-sm rounded-lg">
                        <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 font-semibold text-sm">No terms match your search.</p>
                        <p className="text-xs text-slate-400 mt-1">Try searching another keyword or jargon word.</p>
                    </Card>
                ) : (
                    <div className="space-y-8">
                        {Object.keys(groupedTerms)
                            .sort()
                            .map((letter) => (
                                <div key={letter} className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-sm font-extrabold text-blue-700 bg-blue-50 border border-blue-100 w-7 h-7 rounded-full flex items-center justify-center">
                                            {letter}
                                        </h2>
                                        <div className="h-px bg-slate-200 flex-1" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {groupedTerms[letter].map(([term, definition]) => (
                                            <Card key={term} className="bg-white border border-slate-200 p-4 shadow-sm rounded-lg hover:border-blue-500/20 transition-all space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                    <strong className="text-xs font-semibold text-slate-800 tracking-tight">
                                                        {term}
                                                    </strong>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed pl-5">
                                                    {definition || "(Definition not found)"}
                                                </p>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}
