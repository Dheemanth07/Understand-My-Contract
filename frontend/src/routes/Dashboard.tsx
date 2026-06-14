import { useEffect, useState, useRef, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { API_BASE_URL } from "@/config";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";
import { Clock, FileText, Trash2, LogOut, UploadCloud, Globe, AlertCircle, Sparkles, ChevronRight } from "lucide-react";

interface SectionResult {
    section: number;
    original: string;
    summary: string;
    legalTerms: { term: string; definition: string }[];
}

interface HistoryItem {
    id: string;
    filename: string;
    createdAt: string;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { session, signOut } = UserAuth();

    const [file, setFile] = useState<File | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [analysisResults, setAnalysisResults] = useState<SectionResult[]>([]);
    const [language, setLanguage] = useState("en");

    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (session) {
            fetchHistory();
        }
    }, [session]);

    const fetchHistory = async () => {
        if (!session?.access_token) return;
        try {
            setLoadingHistory(true);
            const resp = await axios.get(`${API_BASE_URL}/history`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            setHistory(resp.data);
        } catch (err) {
            console.error("Failed to fetch history:", err);
            toast({
                title: "Error",
                description: "Could not fetch document history.",
                variant: "destructive",
            });
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleUpload = async () => {
        if (!file || !session?.access_token) {
            toast({
                title: "Error",
                description: "Please select a file and ensure you are logged in.",
                variant: "destructive",
            });
            return;
        }

        abortControllerRef.current = new AbortController();

        try {
            setUploading(true);
            setAnalysisResults([]);

            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(
                `${API_BASE_URL}/upload?lang=${language}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: formData,
                    signal: abortControllerRef.current.signal,
                },
            );

            if (!response.ok || !response.body) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const messages = buffer.split("\n\n");
                buffer = messages.pop() || "";
                for (const message of messages) {
                    const trimmedMessage = message.trim();
                    if (trimmedMessage.startsWith("data: ")) {
                        const jsonString = trimmedMessage.substring(6).trim();
                        if (jsonString) {
                            try {
                                const data = JSON.parse(jsonString);
                                if (data.done) {
                                    fetchHistory();
                                    return;
                                }
                                if (data.error) throw new Error(data.error);
                                if (data.section) {
                                    setAnalysisResults((prev) => [...prev, data]);
                                }
                            } catch (parseErr) {
                                console.error("Failed to parse SSE JSON chunk:", jsonString, parseErr);
                            }
                        }
                    }
                }
            }
        } catch (err: any) {
            if (err.name === "AbortError") {
                toast({
                    title: "Stopped",
                    description: "Document processing was stopped.",
                });
            } else {
                console.error("Upload failed:", err);
                toast({
                    title: "Upload Failed",
                    description: err.message || "An error occurred.",
                    variant: "destructive",
                });
            }
        } finally {
            setUploading(false);
            abortControllerRef.current = null;
        }
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setUploading(false);
        }
    };

    const handleDelete = async (idToDelete: string, event: MouseEvent) => {
        event.stopPropagation();
        if (!session?.access_token) return;
        if (!window.confirm("Are you sure you want to permanently delete this item?")) {
            return;
        }
        try {
            await axios.delete(`${API_BASE_URL}/history/${idToDelete}`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            setHistory((prevHistory) =>
                prevHistory.filter((item) => item.id !== idToDelete),
            );
            toast({ title: "Success", description: "History item deleted." });
        } catch (err) {
            console.error("Failed to delete history item:", err);
            toast({
                title: "Error",
                description: "Could not delete the item.",
                variant: "destructive",
            });
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate("/");
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to sign out.",
                variant: "destructive",
            });
        }
    };

    const userName = session?.user?.user_metadata?.first_name ||
        session?.user?.user_metadata?.full_name?.split(" ")[0] ||
        session?.user?.email?.split("@")[0] ||
        "User";

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* --- SIDEBAR --- */}
            <aside className="w-80 bg-slate-100 border-r border-slate-200 flex flex-col justify-between p-5 z-10 shrink-0">
                <div className="flex flex-col min-h-0">
                    <div className="mb-6 flex justify-start pl-1">
                        <Logo />
                    </div>

                    <div className="mb-6 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight truncate">
                            Hello, {userName}
                        </h2>
                        <p className="text-slate-500 text-[11px] mt-0.5 font-medium">
                            Welcome to your Dashboard
                        </p>
                    </div>

                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 pl-1">
                        Your History
                    </h3>

                    {/* Scrollable list container */}
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
                        {loadingHistory ? (
                            <div className="py-4 text-center text-xs text-slate-400 animate-pulse">
                                Loading history...
                            </div>
                        ) : history.length > 0 ? (
                            history.map((item) => (
                                <div
                                    key={item.id}
                                    data-testid={`history-item-${item.id}`}
                                    className="p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-500/30 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-all group shadow-sm"
                                    onClick={() => navigate(`/history/${item.id}`)}
                                >
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className="text-xs font-semibold text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                                            {item.filename}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                            {new Date(item.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <Button
                                        data-testid={`delete-history-${item.id}`}
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md shrink-0 transition-all opacity-0 group-hover:opacity-100"
                                        onClick={(e) => handleDelete(item.id, e)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="py-6 text-center text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                                No history yet.
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                    <Button
                        variant="outline"
                        className="w-full bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all rounded-md text-slate-700 gap-2 text-xs font-semibold h-10 shadow-sm"
                        onClick={handleSignOut}
                    >
                        <LogOut className="w-3.5 h-3.5 text-slate-500" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col min-h-0 bg-slate-50/50 overflow-y-auto">
                <div className="max-w-5xl w-full mx-auto px-6 py-8 space-y-6 flex-1">
                    {/* Header bar */}
                    <header className="flex justify-between items-center pb-4 border-b border-slate-200/60">
                        <div>
                            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                                LegalSimplify Studio
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Convert raw legalese to plain language instantly.
                            </p>
                        </div>
                    </header>

                    {/* Upload Card */}
                    <Card className="bg-white border border-slate-200/80 p-6 shadow-sm rounded-lg space-y-5">
                        <div className="space-y-5">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <UploadCloud className="w-4 h-4 text-blue-600" />
                                Upload Your Legal Document
                            </h2>

                            {/* Dropzone container */}
                            <div className="relative border border-dashed border-slate-300 hover:border-blue-500/50 rounded-lg p-5 flex flex-col items-center justify-center bg-slate-50/50 cursor-pointer transition-all hover:bg-slate-50 group">
                                <Label htmlFor="file-upload" className="absolute inset-0 cursor-pointer w-full h-full" />
                                <Input
                                    id="file-upload"
                                    type="file"
                                    accept=".pdf,.docx,.txt"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                    aria-label="Select a file"
                                />
                                <div className="space-y-2 text-center pointer-events-none">
                                    <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="text-xs">
                                        {file ? (
                                            <span className="font-semibold text-blue-800 truncate max-w-xs block mx-auto">{file.name}</span>
                                        ) : (
                                            <span className="text-slate-500 font-semibold">Select a file (.pdf, .docx, .txt)</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400">
                                        {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Max file size: 10MB"}
                                    </p>
                                </div>
                            </div>

                            {/* Language Selector */}
                            <div className="space-y-1.5">
                                <Label htmlFor="output-language" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                                    Output Translation Language
                                </Label>
                                <select
                                    id="output-language"
                                    aria-label="Output Language"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full h-10 px-3 border rounded-md bg-white border-slate-300 text-slate-700 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                >
                                    <option value="en">English (Default)</option>
                                    {/* <option value="hi">Hindi (हिंदी)</option>
                                    <option value="kn">Kannada (ಕನ್ನಡ)</option>
                                    <option value="ta">Tamil (தமிழ்)</option>
                                    <option value="te">Telugu (తెలుగు)</option>
                                    <option value="es">Spanish (Español)</option>
                                    <option value="fr">French (Français)</option> */}
                                </select>
                            </div>

                            {/* Submit / Stop Buttons */}
                            {!uploading ? (
                                <Button
                                    data-testid="upload-button"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-all h-10 shadow-sm"
                                    onClick={handleUpload}
                                    disabled={!file}
                                >
                                    Upload & Simplify
                                </Button>
                            ) : (
                                <Button
                                    className="w-full border border-red-300 hover:border-red-400 bg-transparent hover:bg-red-50/30 text-red-600 font-semibold rounded-md transition-all h-10 shadow-sm gap-2"
                                    onClick={handleStop}
                                >
                                    <AlertCircle className="w-4 h-4 animate-pulse" />
                                    Stop Processing
                                </Button>
                            )}
                        </div>
                    </Card>

                    {/* --- RESULTS SECTION --- */}
                    {analysisResults.length > 0 && (
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-blue-600" />
                                    Analysis Results
                                </h2>
                                <span className="text-[10px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-100 font-semibold animate-pulse">
                                    Simplifying clauses...
                                </span>
                            </div>

                            <div className="space-y-4 animate-fade-in">
                                {analysisResults.map((result, index) => (
                                    <div key={index} className="space-y-3 bg-white p-5 border border-slate-200/80 shadow-sm rounded-lg">
                                        <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                                            Section {result.section}
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Original Clause Card */}
                                            <Card className="bg-slate-50/50 border border-slate-200/80 p-4 shadow-sm rounded-md">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Original Text</p>
                                                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                    {result.original}
                                                </p>
                                            </Card>

                                            {/* Simplified Clause Card */}
                                            <Card className="bg-blue-50/5 border border-blue-200/50 p-4 shadow-sm rounded-md">
                                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">Simplified Summary</p>
                                                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                                                    {result.summary}
                                                </p>
                                            </Card>
                                        </div>

                                        {result.legalTerms && result.legalTerms.length > 0 && (
                                            <div className="mt-2 pt-3 border-t border-slate-100 space-y-2">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Key Legal Terms</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {result.legalTerms.map((term, termIndex) => (
                                                        <div
                                                            key={termIndex}
                                                            className="text-xs bg-slate-50 border border-slate-200 rounded p-2.5 max-w-md shadow-sm"
                                                        >
                                                            <strong className="text-slate-800 font-semibold">{term.term}</strong>
                                                            <span className="text-slate-500 block mt-0.5 leading-relaxed text-[11px]">
                                                                {term.definition}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
