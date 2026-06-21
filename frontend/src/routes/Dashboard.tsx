import { useEffect, useState, useRef, MouseEvent, useCallback } from "react";
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
import { Clock, FileText, Trash2, LogOut, UploadCloud, Globe, AlertCircle, Sparkles, ChevronRight, MessageSquare, Send, X, AlertTriangle, ShieldCheck, Download, BookOpen } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface SectionResult {
    section: number;
    original: string;
    summary: string;
    legalTerms: { term: string; definition: string }[];
}

interface RiskResult {
    clause: string;
    severity: string;
    risk: string;
    recommendation: string;
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
    const [risks, setRisks] = useState<RiskResult[]>([]);
    const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
    const [analyzedDocId, setAnalyzedDocId] = useState<string | null>(null);
    const [activeDocumentName, setActiveDocumentName] = useState<string>("");
    const [language, setLanguage] = useState("en");

    // Chatbot state
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [sendingChat, setSendingChat] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const checkScrollPosition = useCallback(() => {
        const docHeight = document.documentElement.scrollHeight;
        const scrollPos = window.scrollY || document.documentElement.scrollTop;
        const viewHeight = window.innerHeight;
        const distFromBottom = docHeight - scrollPos - viewHeight;
        setShowScrollBtn(distFromBottom > 100 && docHeight > viewHeight);
    }, []);

    const scrollToBottom = () => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    };

    // Sync activeAnalysisId to sessionStorage so navigation away doesn't lose job state
    useEffect(() => {
        if (activeAnalysisId) {
            sessionStorage.setItem("activeAnalysisId", activeAnalysisId);
            sessionStorage.setItem("uploading", "true");
        } else {
            sessionStorage.removeItem("activeAnalysisId");
            sessionStorage.removeItem("uploading");
        }
    }, [activeAnalysisId]);

    // On mount: check if there was an active analysis in progress (e.g. user navigated away and came back)
    useEffect(() => {
        const savedId = sessionStorage.getItem("activeAnalysisId");
        const wasUploading = sessionStorage.getItem("uploading") === "true";
        if (savedId && wasUploading && session?.access_token) {
            // Resume polling immediately — sets uploading=true so the Stop button appears
            setActiveAnalysisId(savedId);
            setAnalyzedDocId(savedId);
            setUploading(true);
            toast({
                title: "Resuming Analysis",
                description: "Your document is still being processed. Resuming progress tracking.",
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    useEffect(() => {
        window.addEventListener("scroll", checkScrollPosition, { passive: true });
        checkScrollPosition();
        return () => window.removeEventListener("scroll", checkScrollPosition);
    }, [checkScrollPosition, analysisResults, uploading, loadingHistory]);

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

    useEffect(() => {
        if (!activeAnalysisId || !session?.access_token) return;

        let isMounted = true;
        const intervalId = setInterval(async () => {
            try {
                const resp = await axios.get(`${API_BASE_URL}/history/${activeAnalysisId}`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (!isMounted) return;
                const data = resp.data;

                if (data.status === "completed") {
                    setAnalysisResults(data.sections || []);
                    setRisks(data.risks || []);
                    setUploading(false);
                    setActiveAnalysisId(null); // also clears sessionStorage via the sync effect
                    if (data.filename) setActiveDocumentName(data.filename);
                    fetchHistory();
                    toast({
                        title: "✅ Analysis Completed",
                        description: "Your document was simplified successfully.",
                    });
                } else if (data.status === "failed") {
                    setUploading(false);
                    setActiveAnalysisId(null);
                    fetchHistory();
                    toast({
                        title: "Analysis Failed",
                        description: "Document processing failed. Please try again.",
                        variant: "destructive",
                    });
                } else if (data.status === "processing") {
                    // Show incremental sections as they arrive
                    setAnalysisResults(data.sections || []);
                    if (data.filename && !activeDocumentName) setActiveDocumentName(data.filename);
                }
            } catch (err) {
                console.error("Error polling progress:", err);
            }
        }, 3000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [activeAnalysisId, session]);

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
            setRisks([]);
            setChatMessages([]);

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

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const data = await response.json();
            if (data.analysisId) {
                sessionStorage.setItem("activeAnalysisId", data.analysisId);
                sessionStorage.setItem("uploading", "true");
                setActiveAnalysisId(data.analysisId);
                setAnalyzedDocId(data.analysisId);
                setActiveDocumentName(file.name);
            } else {
                throw new Error("No analysis ID returned by server.");
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
            setUploading(false);
        }
    };

    const handleStop = async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const idToStop = activeAnalysisId || sessionStorage.getItem("activeAnalysisId");
        if (idToStop && session?.access_token) {
            try {
                // Delete the doc on backend so background job exits on next heartbeat check
                await axios.delete(`${API_BASE_URL}/history/${idToStop}`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
            } catch (err) {
                console.error("Failed to delete processing analysis:", err);
            }
        }
        // Clear sessionStorage immediately so the restored state doesn't persist
        sessionStorage.removeItem("activeAnalysisId");
        sessionStorage.removeItem("uploading");
        setUploading(false);
        setActiveAnalysisId(null);
    };

    const handleExportPDF = async () => {
        const element = document.getElementById("pdf-report-content");
        if (!element) {
            toast({
                title: "Error",
                description: "Report content not found.",
                variant: "destructive",
            });
            return;
        }

        try {
            toast({
                title: "Exporting PDF",
                description: "Generating high-quality document report...",
            });

            // Ensure all fonts are fully loaded for perfect text shaping
            await document.fonts.ready;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#f8fafc",
                windowWidth: 1200, // Force standard desktop viewport width
                onclone: (clonedDoc) => {
                    // Hide header buttons/actions and ignored components in cloned DOM
                    const ignoreSelectors = [
                        "[data-html2canvas-ignore]",
                        "button",
                        "a",
                        "select",
                        "input",
                        ".fixed",
                        ".floating-actions",
                        "header div.flex.items-center.gap-2.shrink-0",
                        "header .flex.items-center.gap-2"
                    ];
                    ignoreSelectors.forEach((selector) => {
                        clonedDoc.querySelectorAll(selector).forEach((el) => {
                            (el as HTMLElement).style.setProperty("display", "none", "important");
                        });
                    });

                    // Force the report content element to use explicit desktop width
                    const reportContent = clonedDoc.getElementById("pdf-report-content");
                    if (reportContent) {
                        reportContent.style.setProperty("width", "1024px", "important");
                        reportContent.style.setProperty("max-width", "1024px", "important");
                        reportContent.style.setProperty("min-width", "1024px", "important");
                        reportContent.style.setProperty("margin", "0 auto", "important");
                        reportContent.style.setProperty("padding", "32px", "important");
                        reportContent.style.setProperty("box-sizing", "border-box", "important");
                    }

                    // ── Fix truncation: remove overflow/clip/ellipsis on ALL elements ──
                    clonedDoc.querySelectorAll("*").forEach((el) => {
                        const htmlEl = el as HTMLElement;
                        if (
                            htmlEl.classList.contains("truncate") ||
                            htmlEl.classList.contains("overflow-hidden") ||
                            htmlEl.classList.contains("min-w-0")
                        ) {
                            htmlEl.style.setProperty("overflow", "visible", "important");
                            htmlEl.style.setProperty("text-overflow", "clip", "important");
                            htmlEl.style.setProperty("white-space", "normal", "important");
                        }
                    });

                    // ── Generous spacing on header ──
                    const header = clonedDoc.querySelector("header");
                    if (header) {
                        (header as HTMLElement).style.setProperty("padding-bottom", "28px", "important");
                        (header as HTMLElement).style.setProperty("margin-bottom", "12px", "important");
                        (header as HTMLElement).style.setProperty("display", "block", "important");
                    }
                    // Make the h2 report title wrap freely
                    clonedDoc.querySelectorAll("h2").forEach((h) => {
                        (h as HTMLElement).style.setProperty("white-space", "normal", "important");
                        (h as HTMLElement).style.setProperty("overflow", "visible", "important");
                        (h as HTMLElement).style.setProperty("text-overflow", "clip", "important");
                        (h as HTMLElement).style.setProperty("word-break", "break-word", "important");
                        (h as HTMLElement).style.setProperty("margin-bottom", "6px", "important");
                    });

                    // ── Card content: generous padding on all cards ──
                    clonedDoc.querySelectorAll(".p-4").forEach((el) => {
                        (el as HTMLElement).style.setProperty("padding", "20px", "important");
                    });
                    clonedDoc.querySelectorAll(".p-5").forEach((el) => {
                        (el as HTMLElement).style.setProperty("padding", "22px", "important");
                    });
                    clonedDoc.querySelectorAll(".p-3").forEach((el) => {
                        (el as HTMLElement).style.setProperty("padding", "16px", "important");
                    });

                    // ── Add vertical breathing room between section result cards ──
                    clonedDoc.querySelectorAll("[class*='space-y-4'], [class*='space-y-6']").forEach((el) => {
                        (el as HTMLElement).style.setProperty("row-gap", "24px", "important");
                    });

                    // ── Individual result/info cards: add margin between them ──
                    clonedDoc.querySelectorAll("[class*='rounded-lg'][class*='border']").forEach((card) => {
                        (card as HTMLElement).style.setProperty("margin-bottom", "20px", "important");
                    });

                    // ── Convert all CSS Grid elements to robust flex/block elements ──
                    const grids = clonedDoc.querySelectorAll(".grid");
                    grids.forEach((grid) => {
                        const el = grid as HTMLElement;
                        
                        let cols = 1;
                        if (el.classList.contains("md:grid-cols-3") || el.classList.contains("grid-cols-3")) {
                            cols = 3;
                        } else if (el.classList.contains("md:grid-cols-2") || el.classList.contains("grid-cols-2")) {
                            cols = 2;
                        }

                        el.style.setProperty("display", "flex", "important");
                        el.style.setProperty("flex-direction", "row", "important");
                        el.style.setProperty("flex-wrap", "nowrap", "important");
                        el.style.setProperty("gap", "20px", "important");
                        el.style.setProperty("width", "100%", "important");
                        el.style.setProperty("box-sizing", "border-box", "important");
                        el.style.setProperty("margin-bottom", "20px", "important");

                        const children = Array.from(el.children);
                        if (cols > 1 && children.length > 0) {
                            const widthPercent = Math.floor(100 / cols) - 2;
                            children.forEach((child) => {
                                const childEl = child as HTMLElement;
                                childEl.style.setProperty("width", `${widthPercent}%`, "important");
                                childEl.style.setProperty("max-width", `${widthPercent}%`, "important");
                                childEl.style.setProperty("flex", "1 1 0%", "important");
                                childEl.style.setProperty("box-sizing", "border-box", "important");
                                childEl.style.setProperty("display", "block", "important");
                                childEl.style.setProperty("overflow", "visible", "important");
                                childEl.style.setProperty("min-width", "0", "important");
                            });
                        } else {
                            el.style.setProperty("flex-direction", "column", "important");
                            children.forEach((child) => {
                                const childEl = child as HTMLElement;
                                childEl.style.setProperty("width", "100%", "important");
                                childEl.style.setProperty("max-width", "100%", "important");
                                childEl.style.setProperty("box-sizing", "border-box", "important");
                                childEl.style.setProperty("display", "block", "important");
                                childEl.style.setProperty("overflow", "visible", "important");
                            });
                        }
                    });

                    // Avoid flex wrap badge collapsing issues
                    const flexWraps = clonedDoc.querySelectorAll(".flex.flex-wrap");
                    flexWraps.forEach((flex) => {
                        const el = flex as HTMLElement;
                        el.style.setProperty("display", "flex", "important");
                        el.style.setProperty("flex-direction", "row", "important");
                        el.style.setProperty("flex-wrap", "wrap", "important");
                        el.style.setProperty("gap", "8px", "important");
                    });
                }
            });

            const imgData = canvas.toDataURL("image/png");
            
            const pdf = new jsPDF("p", "mm", "a4");
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const cleanName = (activeDocumentName || "simplified_contract").replace(/\.[^/.]+$/, "");
            pdf.save(`${cleanName}_simplified.pdf`);
            
            toast({
                title: "Success",
                description: "PDF report exported successfully.",
            });
        } catch (err) {
            console.error("PDF export error:", err);
            toast({
                title: "Export Failed",
                description: "Could not export PDF report.",
                variant: "destructive",
            });
        }
    };

    const handleSendChatMessage = async () => {
        const docId = activeAnalysisId || analyzedDocId;
        if (!docId) {
            toast({
                title: "Error",
                description: "Please analyze a document first to start a chat.",
                variant: "destructive",
            });
            return;
        }
        if (!chatInput.trim() || !session?.access_token) return;

        const userMsg = chatInput.trim();
        setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
        setChatInput("");
        setSendingChat(true);

        try {
            const resp = await axios.post(
                `${API_BASE_URL}/history/${docId}/chat`,
                { message: userMsg },
                { headers: { Authorization: `Bearer ${session.access_token}` } }
            );
            setChatMessages((prev) => [...prev, { sender: "bot", text: resp.data.reply }]);
        } catch (err) {
            console.error("Chat error:", err);
            setChatMessages((prev) => [
                ...prev,
                { sender: "bot", text: "Sorry, I had trouble analyzing that question. Please try again." },
            ]);
        } finally {
            setSendingChat(false);
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

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (!session?.access_token) return;
        if (!window.confirm(`Are you sure you want to permanently delete the ${selectedIds.length} selected document(s)?`)) {
            return;
        }
        try {
            await Promise.all(
                selectedIds.map((id) =>
                    axios.delete(`${API_BASE_URL}/history/${id}`, {
                        headers: { Authorization: `Bearer ${session.access_token}` },
                    })
                )
            );
            setHistory((prevHistory) =>
                prevHistory.filter((item) => !selectedIds.includes(item.id))
            );
            setSelectedIds([]);
            toast({ title: "Success", description: "Selected history items deleted." });
        } catch (err) {
            console.error("Failed to delete history items:", err);
            toast({
                title: "Error",
                description: "Could not delete some items.",
                variant: "destructive",
            });
            fetchHistory();
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
        <>
        <div className="flex min-h-screen bg-slate-50 font-sans">
            {/* --- SIDEBAR --- */}
            <aside className="w-80 bg-slate-100 border-r border-slate-200 flex flex-col justify-between p-5 z-10 shrink-0 sticky top-0 h-screen overflow-y-auto">
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

                    <div className="flex justify-between items-center mb-3 pl-1 pr-1">
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Your History
                        </h3>
                        {history.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="checkbox"
                                    id="select-all-history"
                                    aria-label="Select all documents"
                                    checked={history.length > 0 && selectedIds.length === history.length}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedIds(history.map(item => item.id));
                                        } else {
                                            setSelectedIds([]);
                                        }
                                    }}
                                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <label htmlFor="select-all-history" className="text-[10px] font-semibold text-slate-500 cursor-pointer select-none">
                                    Select All
                                </label>
                            </div>
                        )}
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="mb-3 px-1">
                            <Button
                                variant="destructive"
                                size="sm"
                                className="w-full text-xs font-semibold h-8 rounded-md flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                onClick={handleDeleteSelected}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Selected ({selectedIds.length})
                            </Button>
                        </div>
                    )}

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
                                    className="p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-500/30 hover:bg-slate-50 cursor-pointer flex items-center transition-all group shadow-sm gap-2.5"
                                    onClick={() => navigate(`/history/${item.id}`)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(item.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedIds((prev) => [...prev, item.id]);
                                            } else {
                                                setSelectedIds((prev) => prev.filter((id) => id !== item.id));
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                                            {item.filename}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                            {new Date(item.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-6 text-center text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                                No history yet.
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main
                className="flex-1 flex flex-col bg-slate-50/50"
            >
                <div className="max-w-5xl w-full mx-auto px-6 py-8 space-y-6">
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
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                className="bg-white border-slate-300 hover:bg-slate-50 transition-all rounded-md text-slate-700 gap-2 text-xs font-semibold h-10 px-4 shadow-sm"
                                onClick={() => navigate("/glossary")}
                            >
                                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                                Jargon Library
                            </Button>
                            {analysisResults.length > 0 && !uploading && (
                                <Button
                                    variant="outline"
                                    className="bg-white border-slate-300 hover:bg-slate-50 transition-all rounded-md text-slate-700 gap-2 text-xs font-semibold h-10 px-4 shadow-sm"
                                    onClick={handleExportPDF}
                                >
                                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                                    Export PDF
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                className="bg-white border-slate-300 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all rounded-md text-slate-700 gap-2 text-xs font-semibold h-10 px-4 shadow-sm"
                                onClick={handleSignOut}
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                Logout
                            </Button>
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
                                    <option value="hi">Hindi (हिंदी)</option>
                                    <option value="kn">Kannada (ಕನ್ನಡ)</option>
                                    <option value="ta">Tamil (தமிழ்)</option>
                                    <option value="te">Telugu (తెలుగు)</option>
                                    <option value="es">Spanish (Español)</option>
                                    <option value="fr">French (Français)</option>
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
                        <div id="pdf-report-content" className="space-y-4 pt-2">
                            {/* Report Header Card */}
                            <div className="bg-white border border-slate-200/80 p-5 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <h2 className="text-base font-extrabold text-slate-900">LegalSimplify Analysis Report</h2>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">
                                        Document: <span className="font-bold text-slate-800">{activeDocumentName || "Simplified Contract"}</span>
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                        Generated: {new Date().toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-xs font-bold text-blue-600 bg-blue-50/50 border border-blue-100 px-3 py-1.5 rounded-md uppercase tracking-wider">
                                    Simplified Output
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-blue-600" />
                                    Analysis Results
                                </h2>
                                {uploading && (
                                    <span className="text-[10px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-100 font-semibold animate-pulse">
                                        Simplifying clauses...
                                    </span>
                                )}
                            </div>

                            {/* Risk Analysis warning panel */}
                            {risks.length > 0 && (
                                <div className="space-y-3 bg-red-50/30 p-5 border border-red-200/60 rounded-lg animate-fade-in">
                                    <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-red-600 animate-bounce" />
                                        Risk & Redline Findings
                                    </h3>
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                        Our AI detected the following potential legal risks and warning flags in this contract. Please review them carefully.
                                    </p>
                                    <div className="grid grid-cols-1 gap-3 mt-2">
                                        {risks.map((risk, idx) => {
                                            const isHigh = risk.severity.toLowerCase() === "high";
                                            const isMedium = risk.severity.toLowerCase() === "medium";
                                            const bgClass = isHigh ? "bg-red-50 border-red-200" : isMedium ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200";
                                            const textClass = isHigh ? "text-red-800" : isMedium ? "text-amber-800" : "text-blue-800";
                                            const label = isHigh ? "High Severity" : isMedium ? "Medium Severity" : "Low Severity";
                                            
                                            return (
                                                <Card key={idx} className={`p-4 border shadow-sm rounded-lg ${bgClass} flex flex-col gap-2`}>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-800">
                                                            {risk.clause}
                                                        </span>
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 bg-white shadow-sm ${textClass}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${isHigh ? "bg-red-600 animate-pulse" : isMedium ? "bg-amber-500 animate-pulse" : "bg-blue-500"}`} />
                                                            {label}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-700 leading-relaxed font-medium">
                                                        <strong className="text-slate-900 block mb-0.5">Identified Risk:</strong>
                                                        {risk.risk}
                                                    </div>
                                                    <div className="text-xs text-slate-700 leading-relaxed font-medium bg-white/70 p-2.5 rounded border border-black/5 mt-1">
                                                        <strong className="text-blue-700 block mb-0.5">Recommendation:</strong>
                                                        {risk.recommendation}
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

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

        {/* --- FLOATING Q&A CHATBOT --- */}
        {(analyzedDocId || activeAnalysisId) && (
            <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
                {/* Chat Panel / Drawer */}
                {isChatOpen && (
                    <Card className="w-96 h-[500px] mb-4 bg-white border border-slate-200/80 shadow-2xl rounded-xl flex flex-col overflow-hidden animate-slide-in-up">
                        {/* Header */}
                        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-blue-400" />
                                <div>
                                    <h3 className="text-xs font-bold tracking-tight">Contract Assistant</h3>
                                    <p className="text-[10px] text-slate-400 truncate max-w-[200px] font-medium mt-0.5">
                                        {activeDocumentName || "Document"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsChatOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                                aria-label="Close chat"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
                            {chatMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                    <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-2">
                                        <MessageSquare className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-700">Ask about this contract</p>
                                    <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] font-medium">
                                        Ask questions about clauses, obligations, liabilities, or deadlines.
                                    </p>
                                </div>
                            ) : (
                                chatMessages.map((msg, idx) => {
                                    const isUser = msg.sender === "user";
                                    return (
                                        <div
                                            key={idx}
                                            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-lg p-3 text-xs leading-relaxed shadow-sm font-medium ${
                                                    isUser
                                                        ? "bg-blue-600 text-white rounded-br-none"
                                                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"
                                                }`}
                                            >
                                                {msg.text}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            {sendingChat && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-200 rounded-lg rounded-bl-none p-3 shadow-sm flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-100" />
                                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-200" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Footer */}
                        <div className="p-3 border-t border-slate-100 bg-white">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendChatMessage();
                                }}
                                className="flex gap-2"
                            >
                                <Input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask a question..."
                                    className="text-xs h-9 bg-slate-50 border-slate-200 focus:bg-white"
                                    disabled={sendingChat}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 h-9 w-9"
                                    disabled={sendingChat || !chatInput.trim()}
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </Button>
                            </form>
                        </div>
                    </Card>
                )}

                {/* Floating Action Button */}
                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    aria-label="Toggle chat"
                    className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 z-50 animate-bounce"
                >
                    {isChatOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                </button>
            </div>
        )}

        {/* Scroll-to-bottom button — only when results are visible and not at bottom */}
        {analysisResults.length > 0 && showScrollBtn && (
            <button
                onClick={scrollToBottom}
                aria-label="Scroll to bottom"
                className={`fixed bottom-6 ${analyzedDocId || activeAnalysisId ? "right-24" : "right-6"} z-50 w-10 h-10 rounded-full bg-slate-800/80 text-white flex items-center justify-center shadow-lg hover:bg-slate-700 transition-all hover:scale-105 active:scale-95 backdrop-blur-sm`}
            >
                <ChevronRight className="w-4 h-4 rotate-90" />
            </button>
        )}
        </>
    );
}
