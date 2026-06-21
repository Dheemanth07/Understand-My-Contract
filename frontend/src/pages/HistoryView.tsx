// src/pages/HistoryView.tsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/config";
import { ArrowLeft, Clock, FileText, Globe, Mail, ShieldAlert, ChevronRight, Download, BookOpen, AlertTriangle, MessageSquare, Send, X } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { formatMarkdownToHtml } from "@/lib/utils";

export default function HistoryView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [docData, setDocData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    // Chatbot state
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [sendingChat, setSendingChat] = useState(false);

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
            setIsExportingPDF(true);
            toast({
                title: "Exporting PDF",
                description: "Generating document report...",
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

                    // ── Fix truncation: remove any overflow/clip/ellipsis on ALL elements ──
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
                    // Make the title wrap freely and show in full
                    const h1 = clonedDoc.querySelector("header h1");
                    if (h1) {
                        (h1 as HTMLElement).style.setProperty("white-space", "normal", "important");
                        (h1 as HTMLElement).style.setProperty("overflow", "visible", "important");
                        (h1 as HTMLElement).style.setProperty("text-overflow", "clip", "important");
                        (h1 as HTMLElement).style.setProperty("font-size", "22px", "important");
                        (h1 as HTMLElement).style.setProperty("margin-bottom", "8px", "important");
                        (h1 as HTMLElement).style.setProperty("line-height", "1.4", "important");
                        (h1 as HTMLElement).style.setProperty("word-break", "break-word", "important");
                    }

                    // ── Ensure the header text container fills width ──
                    const headerTitleBlock = clonedDoc.querySelector("header .space-y-1\\.5, header .space-y-1, header > div:first-child");
                    if (headerTitleBlock) {
                        (headerTitleBlock as HTMLElement).style.setProperty("max-width", "100%", "important");
                        (headerTitleBlock as HTMLElement).style.setProperty("width", "100%", "important");
                    }

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

                    // ── Add vertical breathing room between sections ──
                    clonedDoc.querySelectorAll("section").forEach((sec) => {
                        (sec as HTMLElement).style.setProperty("margin-bottom", "32px", "important");
                        (sec as HTMLElement).style.setProperty("padding-top", "8px", "important");
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
                            });
                        } else {
                            el.style.setProperty("flex-direction", "column", "important");
                            children.forEach((child) => {
                                const childEl = child as HTMLElement;
                                childEl.style.setProperty("width", "100%", "important");
                                childEl.style.setProperty("max-width", "100%", "important");
                                childEl.style.setProperty("box-sizing", "border-box", "important");
                                childEl.style.setProperty("display", "block", "important");
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

            const cleanName = (docData.filename || "simplified_contract").replace(/\.[^/.]+$/, "");
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
        } finally {
            setIsExportingPDF(false);
        }
    };

    const handleSendChatMessage = async () => {
        if (!id) return;
        if (!chatInput.trim()) return;

        const userMsg = chatInput.trim();
        setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
        setChatInput("");
        setSendingChat(true);

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;
            if (!token) throw new Error("No authorization token");

            const resp = await axios.post(
                `${API_BASE_URL}/history/${id}/chat`,
                { message: userMsg },
                { headers: { Authorization: `Bearer ${token}` } }
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

    const checkScroll = useCallback(() => {
        const distFromBottom = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
        setShowScrollBtn(distFromBottom > 100);
    }, []);

    useEffect(() => {
        window.addEventListener("scroll", checkScroll, { passive: true });
        return () => window.removeEventListener("scroll", checkScroll);
    }, [checkScroll]);

    const scrollToBottom = () => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    };

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
                setDocData(dataJson);
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
            <div className="min-h-screen bg-slate-50 font-sans pb-16">
                <div className="max-w-5xl mx-auto px-6 pt-10 space-y-6">
                    {/* Header skeleton */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
                        <div className="space-y-2 w-full max-w-sm">
                            <div className="h-7 bg-slate-200 rounded-md animate-pulse w-3/4" />
                            <div className="h-3.5 bg-slate-200 rounded animate-pulse w-1/2" />
                        </div>
                        <div className="flex gap-2">
                            <div className="h-10 w-32 bg-slate-200 rounded-md animate-pulse" />
                            <div className="h-10 w-28 bg-slate-200 rounded-md animate-pulse" />
                            <div className="h-10 w-20 bg-slate-200 rounded-md animate-pulse" />
                        </div>
                    </div>

                    {/* Meta cards skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
                                <div className="w-8 h-8 rounded-lg bg-slate-200 animate-pulse shrink-0" />
                                <div className="space-y-1.5 flex-1">
                                    <div className="h-2.5 bg-slate-200 rounded animate-pulse w-2/3" />
                                    <div className="h-3.5 bg-slate-200 rounded animate-pulse w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Section heading skeleton */}
                    <div className="h-5 bg-slate-200 rounded animate-pulse w-36 mt-4" />

                    {/* Section card skeletons */}
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                            <div className="h-3 bg-blue-100 rounded animate-pulse w-20" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-md p-4">
                                    <div className="h-2.5 bg-slate-200 rounded animate-pulse w-1/3" />
                                    <div className="space-y-1.5">
                                        <div className="h-3 bg-slate-200 rounded animate-pulse w-full" />
                                        <div className="h-3 bg-slate-200 rounded animate-pulse w-5/6" />
                                        <div className="h-3 bg-slate-200 rounded animate-pulse w-4/6" />
                                    </div>
                                </div>
                                <div className="space-y-2 bg-blue-50/20 border border-blue-100 rounded-md p-4">
                                    <div className="h-2.5 bg-blue-100 rounded animate-pulse w-1/3" />
                                    <div className="space-y-1.5">
                                        <div className="h-3 bg-slate-200 rounded animate-pulse w-full" />
                                        <div className="h-3 bg-slate-200 rounded animate-pulse w-5/6" />
                                        <div className="h-3 bg-slate-200 rounded animate-pulse w-3/6" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );

    if (!docData)
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
        <>
            <div className="min-h-screen bg-slate-50 text-slate-700 font-sans pb-16">
                <div id="pdf-report-content" className="max-w-5xl mx-auto px-6 pt-10 space-y-6">

                    {/* --- HEADER --- */}
                    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
                        <div className="space-y-1.5 max-w-xl">
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight truncate max-w-full">
                                {docData.filename || "Document Summary"}
                            </h1>
                            <p className="text-xs text-slate-500 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                Created: {new Date(docData.createdAt).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="outline"
                                className="bg-white border-slate-300 hover:bg-slate-50 transition-all rounded-md text-slate-700 gap-2 text-xs font-semibold h-10 px-4 shadow-sm"
                                onClick={() => navigate("/glossary")}
                            >
                                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                                Jargon Library
                            </Button>
                            <Button
                                variant="outline"
                                className="bg-white border-slate-300 hover:bg-slate-50 transition-all rounded-md text-slate-700 gap-2 text-xs font-semibold h-10 px-4 shadow-sm disabled:opacity-60"
                                onClick={handleExportPDF}
                                disabled={isExportingPDF}
                            >
                                {isExportingPDF ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                                        Export PDF
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 h-10 rounded-md px-4 gap-2 text-xs shadow-sm font-semibold"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Back
                            </Button>
                        </div>
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
                                <p className="text-xs text-slate-700 font-semibold">{docData.inputLang?.toUpperCase() || "EN"}</p>
                            </div>
                        </Card>
                        <Card className="bg-white border border-slate-200 p-4 shadow-sm rounded-lg flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <Globe className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Output Language</p>
                                <p className="text-xs text-slate-700 font-semibold">{docData.outputLang?.toUpperCase() || "EN"}</p>
                            </div>
                        </Card>
                    </section>

                    {/* --- SIMPLIFIED SECTIONS --- */}
                    <section className="space-y-4 pt-4">
                        <h2 className="text-base font-bold text-slate-900">
                            Simplified Sections
                        </h2>

                        {/* Risk Analysis warning panel */}
                        {docData.risks && docData.risks.length > 0 && (
                            <div className="space-y-3 bg-red-50/30 p-5 border border-red-200/60 rounded-lg animate-fade-in">
                                <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600 animate-bounce" />
                                    Risk & Redline Findings
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    Our AI detected the following potential legal risks and warning flags in this contract. Please review them carefully.
                                </p>
                                <div className="grid grid-cols-1 gap-3 mt-2">
                                    {docData.risks.map((risk: any, idx: number) => {
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

                        <div className="space-y-4">
                            {docData.sections.map((section: any, idx: number) => (
                                <Card key={idx} className="bg-white border border-slate-200 p-5 shadow-sm rounded-lg space-y-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-1.5 h-3.5 rounded-full bg-blue-600 inline-block" />
                                        Section {idx + 1}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Original Column Card */}
                                        <div className="space-y-2 bg-slate-50 border border-slate-200 p-4 rounded-md shadow-sm">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Original Text:</p>
                                            <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line">
                                                {section.original}
                                            </p>
                                        </div>

                                        {/* Simplified Column Card */}
                                        <div className="space-y-2 bg-blue-50/60 border border-blue-200 p-4 rounded-md shadow-sm">
                                            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Simplified Summary:</p>
                                            <div 
                                                className="text-slate-800 text-xs leading-relaxed whitespace-pre-line"
                                                dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(section.summary) }}
                                            />
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
                            {Object.keys(docData.glossary || {}).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(docData.glossary).map(([term, definition]: any, i) => (
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

            {/* --- FLOATING Q&A CHATBOT --- */}
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
                                        {docData.filename || "Document"}
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
                                                className={`max-w-[80%] rounded-lg p-3 text-xs leading-relaxed shadow-sm font-medium ${isUser
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

            {/* Scroll-to-bottom button */}
            {showScrollBtn && (
                <button
                    onClick={scrollToBottom}
                    aria-label="Scroll to bottom"
                    className="fixed bottom-6 right-24 z-50 w-10 h-10 rounded-full bg-slate-800/80 text-white flex items-center justify-center shadow-lg hover:bg-slate-700 transition-all hover:scale-105 active:scale-95 backdrop-blur-sm"
                >
                    <ChevronRight className="w-4 h-4 rotate-90" />
                </button>
            )}
        </>
    );
}
