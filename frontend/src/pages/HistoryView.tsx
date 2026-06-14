// src/pages/HistoryView.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { API_BASE_URL } from "@/config";
import { ArrowLeft, Clock, FileText, Globe, Mail, ShieldAlert } from "lucide-react";

export default function HistoryView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [document, setDocument] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await supabase.auth.getUser();
                if (!data?.user) {
                    navigate("/");
                    return;
                }
                setUser(data.user);

                const { data: sessionData } = await supabase.auth.getSession();
                const token = sessionData?.session?.access_token;

                if (!token) {
                    console.error("No access token found!");
                    return;
                }
                const response = await fetch(
                    `${API_BASE_URL}/history/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) throw new Error("Failed to fetch document");
                const dataJson = await response.json();
                setDocument(dataJson);
            } catch (err: any) {
                console.error("Error in fetchData:", err.message || err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading)
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-sm animate-pulse">
                    Loading document...
                </p>
            </div>
        );

    if (!document)
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 text-center">
                <ShieldAlert className="w-12 h-12 text-rose-600 mb-4" />
                <div className="text-slate-800 text-lg font-bold">
                    Document not found or you don’t have access.
                </div>
                <Button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-md h-10" onClick={() => navigate("/dashboard")}>
                    Go to Dashboard
                </Button>
            </div>
        );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-700 font-sans pb-16">
            <div className="max-w-5xl mx-auto px-6 pt-10 space-y-6">
                
                {/* --- HEADER --- */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
                    <div className="space-y-1.5 max-w-xl">
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight truncate max-w-full">
                            {document.filename || "Document Summary"}
                        </h1>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            Created: {new Date(document.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <Button 
                        variant="outline" 
                        className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 h-9 rounded-md px-4 gap-2 text-xs shadow-sm font-semibold" 
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back
                    </Button>
                </header>

                {/* --- METADATA SECTION --- */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-white border border-slate-200 p-4 shadow-sm rounded-lg flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Uploaded by</p>
                            <p className="text-xs text-slate-700 font-semibold truncate">{user?.email}</p>
                        </div>
                    </Card>
                    <Card className="bg-white border border-slate-200 p-4 shadow-sm rounded-lg flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <Globe className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Input Language</p>
                            <p className="text-xs text-slate-700 font-semibold">{document.inputLang?.toUpperCase() || "EN"}</p>
                        </div>
                    </Card>
                    <Card className="bg-white border border-slate-200 p-4 shadow-sm rounded-lg flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <Globe className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Output Language</p>
                            <p className="text-xs text-slate-700 font-semibold">{document.outputLang?.toUpperCase() || "EN"}</p>
                        </div>
                    </Card>
                </section>

                {/* --- SIMPLIFIED SECTIONS --- */}
                <section className="space-y-4 pt-4">
                    <h2 className="text-base font-bold text-slate-900">
                        Simplified Sections
                    </h2>
                    
                    <div className="space-y-4">
                        {document.sections.map((section: any, idx: number) => (
                            <Card key={idx} className="bg-white border border-slate-200/80 p-5 shadow-sm rounded-lg space-y-4">
                                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                                    Section {idx + 1}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Original Column Card */}
                                    <div className="space-y-1 bg-slate-50/50 border border-slate-200/60 p-4 rounded-md">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Original Text:</p>
                                        <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line">
                                            {section.original}
                                        </p>
                                    </div>

                                    {/* Simplified Column Card */}
                                    <div className="space-y-1 bg-blue-50/5 border border-blue-100/50 p-4 rounded-md">
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Simplified Summary:</p>
                                        <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-line">
                                            {section.summary}
                                        </p>
                                    </div>
                                </div>

                                {section.legalTerms?.length > 0 && (
                                    <div className="border-t border-slate-100 pt-3 space-y-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Legal Terms:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {section.legalTerms.map((termObj: any, i: number) => (
                                                <div key={i} className="text-xs bg-slate-50 border border-slate-200 rounded p-2.5 max-w-md shadow-sm">
                                                    <strong className="text-slate-800 font-semibold">{termObj.term}</strong>
                                                    <span className="text-slate-500 block mt-0.5 leading-relaxed text-[11px]">
                                                        {termObj.definition}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                </section>

                {/* --- GLOBAL GLOSSARY --- */}
                <section className="space-y-4 pt-4">
                    <h2 className="text-base font-bold text-slate-900">
                        Glossary
                    </h2>
                    <Card className="bg-white border border-slate-200 p-5 shadow-sm rounded-lg">
                        {Object.keys(document.glossary || {}).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(document.glossary).map(([term, definition]: any, i) => (
                                    <div key={i} className="p-3 bg-slate-50 border border-slate-200/60 rounded-md shadow-sm space-y-0.5">
                                        <strong className="text-xs font-semibold text-slate-800">{term}</strong>
                                        <p className="text-xs text-slate-500 leading-relaxed text-[11px] font-medium">{definition}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-400 text-xs text-center py-4">
                                No glossary terms available.
                            </p>
                        )}
                    </Card>
                </section>
            </div>
        </div>
    );
}
