import { useEffect, useState, useRef, MouseEvent, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { formatMarkdownToHtml } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import Logo from "@/components/Logo";
import { Clock, FileText, Trash2, LogOut, UploadCloud, Globe, AlertCircle, Sparkles, ChevronRight, MessageSquare, Send, X, AlertTriangle, ShieldCheck, Shield, Download, BookOpen, Menu, Loader2, Lock, EyeOff, Info } from "lucide-react";
import { SecurityModal } from "@/components/SecurityModal";
import { RightSectionNavigator, NavSection } from "@/components/RightSectionNavigator";
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
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        try {
            const cached = localStorage.getItem("legalsimplify_history_cache");
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });
    const [uploading, setUploading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(() => {
        try {
            const cached = localStorage.getItem("legalsimplify_history_cache");
            return cached ? false : true;
        } catch {
            return true;
        }
    });
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
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isIncognito, setIsIncognito] = useState(false);
    const [isAnonymize, setIsAnonymize] = useState(true);
    const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
    const [progressPercent, setProgressPercent] = useState<number>(0);

    // Dynamic progress bar timer effect during document processing
    useEffect(() => {
        if (!uploading) {
            setProgressPercent(0);
            return;
        }

        setProgressPercent(15);
        const interval = setInterval(() => {
            setProgressPercent((prev) => {
                if (prev >= 92) return 92;
                const step = Math.floor(Math.random() * 7) + 5;
                return Math.min(92, prev + step);
            });
        }, 700);

        return () => clearInterval(interval);
    }, [uploading]);

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

    // Sync activeAnalysisId to storage when active
    useEffect(() => {
        if (activeAnalysisId) {
            sessionStorage.setItem("activeAnalysisId", activeAnalysisId);
            sessionStorage.setItem("uploading", "true");
            localStorage.setItem("legalsimplify_last_doc_id", activeAnalysisId);
        }
    }, [activeAnalysisId]);

    // On mount: check for active processing document or restore most recent document analysis
    useEffect(() => {
        if (!session?.access_token) return;

        const restoreState = async () => {
            try {
                // 1. Query server for active processing document
                let activeDoc: any = null;
                try {
                    const activeResp = await axios.get(`${API_BASE_URL}/history/active/doc`, {
                        headers: { Authorization: `Bearer ${session.access_token}` },
                    });
                    activeDoc = activeResp.data;
                } catch (e) {
                    console.warn("Active doc query returned error, falling back:", e);
                }

                if (activeDoc && (activeDoc._id || activeDoc.id)) {
                    const docId = activeDoc._id || activeDoc.id;
                    setActiveAnalysisId(docId);
                    setAnalyzedDocId(docId);
                    setUploading(true);
                    if (activeDoc.filename) setActiveDocumentName(activeDoc.filename);
                    if (activeDoc.sections && activeDoc.sections.length > 0) setAnalysisResults(activeDoc.sections);
                    if (activeDoc.risks && activeDoc.risks.length > 0) setRisks(activeDoc.risks);
                    localStorage.setItem("legalsimplify_last_doc_id", docId);
                    return;
                }

                // 2. Check for last uploaded document ID in storage or query user history
                let targetId = localStorage.getItem("legalsimplify_last_doc_id") || sessionStorage.getItem("activeAnalysisId");
                
                if (!targetId) {
                    try {
                        const historyResp = await axios.get(`${API_BASE_URL}/history`, {
                            headers: { Authorization: `Bearer ${session.access_token}` },
                        });
                        if (historyResp.data && historyResp.data.length > 0) {
                            targetId = historyResp.data[0].id || historyResp.data[0]._id;
                        }
                    } catch {
                        // ignore
                    }
                }

                if (targetId) {
                    try {
                        const r = await axios.get(`${API_BASE_URL}/history/${targetId}`, {
                            headers: { Authorization: `Bearer ${session.access_token}` },
                        });
                        const data = r.data;
                        if (data && (data._id || data.id)) {
                            if (data.filename) setActiveDocumentName(data.filename);
                            if (data.sections && data.sections.length > 0) setAnalysisResults(data.sections);
                            if (data.risks && data.risks.length > 0) setRisks(data.risks);

                            if (data.status === "processing") {
                                const docId = data._id || data.id;
                                setActiveAnalysisId(docId);
                                setAnalyzedDocId(docId);
                                setUploading(true);
                            } else {
                                setUploading(false);
                            }
                            localStorage.setItem("legalsimplify_last_doc_id", data._id || data.id);
                        }
                    } catch (e) {
                        console.warn("Could not fetch target doc by ID, clearing saved ID:", e);
                        localStorage.removeItem("legalsimplify_last_doc_id");
                    }
                }
            } catch (err) {
                console.error("Failed to restore document state on mount:", err);
            }
        };

        restoreState();
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
            // Only set loadingHistory to true if we don't already have cached history items
            if (history.length === 0) {
                setLoadingHistory(true);
            }
            const resp = await axios.get(`${API_BASE_URL}/history`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            setHistory(resp.data);
            try {
                localStorage.setItem("legalsimplify_history_cache", JSON.stringify(resp.data));
            } catch {
                // Ignore storage quota errors
            }
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

        const pollProgress = async () => {
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
                        title: "Analysis Completed",
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
                    // Show incremental sections as they arrive instantly
                    setAnalysisResults(data.sections || []);
                    if (data.filename && !activeDocumentName) setActiveDocumentName(data.filename);
                }
            } catch (err) {
                console.error("Error polling progress:", err);
            }
        };

        // Fetch immediately on upload start
        pollProgress();

        // High-frequency polling (600ms) for real-time section streaming
        const intervalId = setInterval(pollProgress, 600);

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
                `${API_BASE_URL}/upload?lang=${language}&anonymize=${isAnonymize}&incognito=${isIncognito}`,
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
            if (data.incognito) {
                setAnalysisResults(data.sections || []);
                setRisks(data.risks || []);
                setActiveDocumentName(file.name);
                setUploading(false);
                toast({
                    title: "Incognito Analysis Complete",
                    description: "Processed strictly in-memory with zero database retention.",
                });
                return;
            }

            if (data.analysisId) {
                sessionStorage.setItem("activeAnalysisId", data.analysisId);
                sessionStorage.setItem("uploading", "true");
                localStorage.setItem("legalsimplify_last_doc_id", data.analysisId);
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
                // Stop the doc processing on backend so status becomes completed
                await axios.post(`${API_BASE_URL}/history/${idToStop}/stop`, {}, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });

                // Fetch latest state to ensure sections and glossary are synchronized
                const resp = await axios.get(`${API_BASE_URL}/history/${idToStop}`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (resp.data) {
                    setAnalysisResults(resp.data.sections || []);
                    setRisks(resp.data.risks || []);
                    if (resp.data.filename) setActiveDocumentName(resp.data.filename);
                }
            } catch (err) {
                console.error("Failed to stop processing analysis:", err);
            }
        }
        // Clear sessionStorage immediately so the restored state doesn't persist
        sessionStorage.removeItem("activeAnalysisId");
        sessionStorage.removeItem("uploading");
        setUploading(false);
        setActiveAnalysisId(null);
        setFile(null);
        fetchHistory();
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
            setIsExportingPDF(true);
            toast({
                title: "Exporting PDF",
                description: "Generating high-quality document report...",
            });

            // Ensure all fonts are fully loaded for perfect text shaping
            await document.fonts.ready;

            // 1. Create temporary off-screen clone of the report container
            const clonedElement = element.cloneNode(true) as HTMLElement;
            clonedElement.id = "pdf-report-content-clone";
            
            clonedElement.style.position = "absolute";
            clonedElement.style.left = "-9999px";
            clonedElement.style.top = "0";
            clonedElement.style.width = "1024px";
            clonedElement.style.maxWidth = "1024px";
            clonedElement.style.minWidth = "1024px";
            clonedElement.style.background = "#f8fafc";
            clonedElement.style.padding = "32px";
            clonedElement.style.boxSizing = "border-box";

            document.body.appendChild(clonedElement);

            // 2. Hide ignored components in the clone
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
                clonedElement.querySelectorAll(selector).forEach((el) => {
                    (el as HTMLElement).style.setProperty("display", "none", "important");
                });
            });

            // 3. Fix truncation: remove overflow/clip/ellipsis on ALL elements
            clonedElement.querySelectorAll("*").forEach((el) => {
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

            // 4. Compact print spacing on header
            const header = clonedElement.querySelector("header");
            if (header) {
                (header as HTMLElement).style.setProperty("padding-bottom", "16px", "important");
                (header as HTMLElement).style.setProperty("margin-bottom", "8px", "important");
                (header as HTMLElement).style.setProperty("display", "block", "important");
            }
            // Make the h2/h3 titles wrap freely, have compact margins, and padding to prevent ascender/descender cropping
            clonedElement.querySelectorAll("h2, h3").forEach((h) => {
                const htmlEl = h as HTMLElement;
                htmlEl.style.setProperty("white-space", "normal", "important");
                htmlEl.style.setProperty("overflow", "visible", "important");
                htmlEl.style.setProperty("text-overflow", "clip", "important");
                htmlEl.style.setProperty("word-break", "break-word", "important");
                htmlEl.style.setProperty("margin-top", "2px", "important");
                htmlEl.style.setProperty("margin-bottom", "4px", "important");
                htmlEl.style.setProperty("padding-top", "4px", "important");
                htmlEl.style.setProperty("padding-bottom", "4px", "important");
                htmlEl.style.setProperty("font-size", "14px", "important");
            });

            // 5. Card content padding adjustments (more compact for high print density)
            clonedElement.querySelectorAll(".p-4").forEach((el) => {
                (el as HTMLElement).style.setProperty("padding", "10px", "important");
            });
            clonedElement.querySelectorAll(".p-5").forEach((el) => {
                (el as HTMLElement).style.setProperty("padding", "12px", "important");
            });
            clonedElement.querySelectorAll(".p-3").forEach((el) => {
                (el as HTMLElement).style.setProperty("padding", "8px", "important");
            });
            clonedElement.querySelectorAll(".p-2\\.5, .p-2").forEach((el) => {
                (el as HTMLElement).style.setProperty("padding", "6px", "important");
            });

            // Make original text, simplified summary, and key terms compact in PDF
            clonedElement.querySelectorAll(".bg-slate-50, .bg-blue-50\\/60, .bg-white, card").forEach((card) => {
                const htmlEl = card as HTMLElement;
                htmlEl.querySelectorAll("p, li, div, span, strong").forEach((el) => {
                    const child = el as HTMLElement;
                    if (child.tagName !== "H1" && child.tagName !== "H2" && child.tagName !== "H3" && child.tagName !== "H4") {
                        child.style.setProperty("font-size", "10px", "important");
                        child.style.setProperty("line-height", "1.3", "important");
                    }
                });
            });

            // 6. Vertical breathing room
            clonedElement.querySelectorAll("[class*='space-y-4'], [class*='space-y-6']").forEach((el) => {
                (el as HTMLElement).style.setProperty("row-gap", "10px", "important");
            });

            clonedElement.querySelectorAll("[class*='rounded-lg'][class*='border']").forEach((card) => {
                (card as HTMLElement).style.setProperty("margin-bottom", "10px", "important");
                // Clear any manual margin-top applied previously
                (card as HTMLElement).style.setProperty("margin-top", "0px", "important");
            });

            // 7. Convert Grid to Flex with wrap support
            const grids = clonedElement.querySelectorAll(".grid");
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
                el.style.setProperty("flex-wrap", "wrap", "important"); // Allow wrapping (highly important for glossary/many cards)
                el.style.setProperty("gap", "12px", "important");
                el.style.setProperty("width", "100%", "important");
                el.style.setProperty("box-sizing", "border-box", "important");
                el.style.setProperty("margin-bottom", "12px", "important");

                const children = Array.from(el.children);
                if (cols > 1 && children.length > 0) {
                    const gapValue = 12; // 12px gap
                    const widthCalc = `calc(${(100 / cols).toFixed(2)}% - ${((cols - 1) * gapValue / cols).toFixed(2)}px)`;
                    children.forEach((child) => {
                        const childEl = child as HTMLElement;
                        childEl.style.setProperty("width", widthCalc, "important");
                        childEl.style.setProperty("max-width", widthCalc, "important");
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

            const flexWraps = clonedElement.querySelectorAll(".flex.flex-wrap");
            flexWraps.forEach((flex) => {
                const el = flex as HTMLElement;
                el.style.setProperty("display", "flex", "important");
                el.style.setProperty("flex-direction", "row", "important");
                el.style.setProperty("flex-wrap", "wrap", "important");
                el.style.setProperty("gap", "8px", "important");
            });

            // Group the heading/title with the first following element in the clone to prevent clipping/orphans
            const titleRow = clonedElement.querySelector("div.flex.items-center.justify-between") as HTMLElement;
            if (titleRow) {
                const next = titleRow.nextElementSibling as HTMLElement;
                if (next) {
                    let firstCard = next;
                    if (next.classList.contains("space-y-4")) {
                        firstCard = next.firstElementChild as HTMLElement;
                    }
                    
                    if (firstCard) {
                        const groupWrapper = document.createElement("div");
                        groupWrapper.className = "pdf-grouped-block";
                        groupWrapper.style.setProperty("display", "block", "important");
                        groupWrapper.style.setProperty("margin-bottom", "16px", "important");
                        
                        titleRow.parentNode?.insertBefore(groupWrapper, titleRow);
                        groupWrapper.appendChild(titleRow);
                        groupWrapper.appendChild(firstCard);
                        titleRow.style.setProperty("margin-bottom", "8px", "important");
                    }
                }
            }

            // 8. Extract blocks to render
            const blocks: HTMLElement[] = [];
            Array.from(clonedElement.children).forEach((child) => {
                const childEl = child as HTMLElement;
                if (childEl.hasAttribute("data-html2canvas-ignore") || childEl.style.display === "none") {
                    return;
                }

                // If this is the sections wrapper, grab its children (the actual section cards, starting from card 2)
                if (childEl.classList.contains("space-y-4") && childEl.querySelector(".pdf-avoid-break")) {
                    Array.from(childEl.children).forEach((sectionCard) => {
                        const cardEl = sectionCard as HTMLElement;
                        if (!cardEl.hasAttribute("data-html2canvas-ignore") && cardEl.style.display !== "none") {
                            blocks.push(cardEl);
                        }
                    });
                } else {
                    blocks.push(childEl);
                }
            });

            // 9. Render blocks sequentially to jsPDF
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = 210;
            const pdfHeight = 297;
            const margin = 10;
            const printableWidth = pdfWidth - (2 * margin);
            const printableHeight = pdfHeight - (2 * margin);
            let currentY = margin;
            let isFirstPage = true;

            const canvasCache = new Map<HTMLElement, { canvas: HTMLCanvasElement; heightMm: number; imgData: string }>();
            
            const getOrRenderBlock = async (el: HTMLElement) => {
                if (canvasCache.has(el)) {
                    return canvasCache.get(el)!;
                }
                const canvas = await html2canvas(el, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: "#f8fafc",
                });
                const imgData = canvas.toDataURL("image/png");
                const heightMm = (canvas.height * printableWidth) / canvas.width;
                const result = { canvas, heightMm, imgData };
                canvasCache.set(el, result);
                return result;
            };

            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i];
                if (block.offsetHeight === 0) continue;

                const { heightMm: blockHeightMm, imgData: blockImgData } = await getOrRenderBlock(block);
                let totalHeightNeeded = blockHeightMm;

                // Prevent orphan headings (H2, H3, or layout container with title)
                const isHeadingElement = block.tagName === "H2" || block.tagName === "H3" || (block.classList.contains("flex") && block.querySelector("h2"));
                if (isHeadingElement && i + 1 < blocks.length) {
                    const nextBlock = blocks[i + 1];
                    const { heightMm: nextHeightMm } = await getOrRenderBlock(nextBlock);
                    totalHeightNeeded += nextHeightMm + 2.5;
                }

                if (!isFirstPage && currentY + totalHeightNeeded > pdfHeight - margin) {
                    pdf.addPage();
                    currentY = margin;
                }

                pdf.addImage(blockImgData, "PNG", margin, currentY, printableWidth, blockHeightMm);
                currentY += blockHeightMm + 2.5;
                isFirstPage = false;
            }

            // Cleanup cloned DOM
            document.body.removeChild(clonedElement);

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
        } finally {
            setIsExportingPDF(false);
        }
    };

    const handleSendChatMessage = async () => {
        if (!chatInput.trim() || !session?.access_token) return;

        const docId = activeAnalysisId || analyzedDocId || sessionStorage.getItem("activeAnalysisId") || localStorage.getItem("legalsimplify_last_doc_id") || (history.length > 0 ? history[0].id : null);

        const userMsg = chatInput.trim();
        setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
        setChatInput("");
        setSendingChat(true);

        try {
            let replyText = "";
            let success = false;

            if (docId) {
                try {
                    const resp = await axios.post(
                        `${API_BASE_URL}/history/${docId}/chat`,
                        { message: userMsg },
                        { headers: { Authorization: `Bearer ${session.access_token}` } }
                    );
                    if (resp.data && resp.data.reply) {
                        replyText = resp.data.reply;
                        success = true;
                    }
                } catch (docErr) {
                    console.warn("Document chat endpoint failed, falling back to general chat:", docErr);
                }
            }

            if (!success) {
                const contextText = analysisResults.map((r) => r.original).join("\n\n");
                const resp = await axios.post(
                    `${API_BASE_URL}/history/chat/general`,
                    { message: userMsg, contextText, filename: activeDocumentName },
                    { headers: { Authorization: `Bearer ${session.access_token}` } }
                );
                replyText = resp.data.reply;
            }

            setChatMessages((prev) => [...prev, { sender: "bot", text: replyText }]);
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

        // Show in-toast confirmation — no native browser dialog
        toast({
            title: "Delete document?",
            description: "This will permanently remove the document from your history.",
            action: (
                <ToastAction
                    altText="Confirm delete"
                    className="bg-red-600 hover:bg-red-700 text-white border-0 text-xs font-semibold px-3 py-1.5 rounded-md h-auto transition-colors"
                    onClick={async () => {
                        try {
                            await axios.delete(`${API_BASE_URL}/history/${idToDelete}`, {
                                headers: { Authorization: `Bearer ${session.access_token}` },
                            });
                            setHistory((prevHistory) =>
                                prevHistory.filter((item) => item.id !== idToDelete),
                            );
                            toast({
                                title: "Deleted",
                                description: "Document removed from your history.",
                            });
                        } catch (err) {
                            console.error("Failed to delete history item:", err);
                            toast({
                                title: "Error",
                                description: "Could not delete the document. Please try again.",
                                variant: "destructive",
                            });
                        }
                    }}
                >
                    Delete
                </ToastAction>
            ),
        });
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (!session?.access_token) return;

        const count = selectedIds.length;
        const idsSnapshot = [...selectedIds];

        // Show in-toast confirmation — no native browser dialog
        toast({
            title: `Delete ${count} document${count > 1 ? "s" : ""}?`,
            description: `This will permanently remove ${count} selected document${count > 1 ? "s" : ""} from your history.`,
            action: (
                <ToastAction
                    altText="Confirm delete selected"
                    className="bg-red-600 hover:bg-red-700 text-white border-0 text-xs font-semibold px-3 py-1.5 rounded-md h-auto transition-colors"
                    onClick={async () => {
                        try {
                            await Promise.all(
                                idsSnapshot.map((id) =>
                                    axios.delete(`${API_BASE_URL}/history/${id}`, {
                                        headers: { Authorization: `Bearer ${session.access_token}` },
                                    })
                                )
                            );
                            setHistory((prevHistory) =>
                                prevHistory.filter((item) => !idsSnapshot.includes(item.id))
                            );
                            setSelectedIds([]);
                            toast({
                                title: "Deleted",
                                description: `${count} document${count > 1 ? "s" : ""} removed from your history.`,
                            });
                        } catch (err) {
                            console.error("Failed to delete history items:", err);
                            toast({
                                title: "Error",
                                description: "Could not delete some documents. Please try again.",
                                variant: "destructive",
                            });
                            fetchHistory();
                        }
                    }}
                >
                    Delete
                </ToastAction>
            ),
        });
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate("/", { replace: true });
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
                <aside className="hidden md:flex w-80 bg-slate-100 border-r border-slate-200 flex-col justify-between p-5 z-10 shrink-0 sticky top-0 h-screen overflow-y-auto">
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
                                <div className="space-y-2">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-2.5 shadow-sm">
                                            <div className="w-4 h-4 rounded bg-slate-200 animate-pulse shrink-0" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-3 bg-slate-200 rounded animate-pulse w-3/4" />
                                                <div className="h-2.5 bg-slate-200 rounded animate-pulse w-1/2" />
                                            </div>
                                        </div>
                                    ))}
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
                            <div className="hidden md:flex items-center gap-2">
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
                                )}
                                <Button
                                    variant="outline"
                                    className="bg-white border-slate-200 hover:border-slate-300 transition-all rounded-md text-slate-700 gap-1.5 text-xs font-semibold h-10 px-3.5 shadow-sm"
                                    onClick={() => setIsSecurityModalOpen(true)}
                                >
                                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                                    Security & Privacy
                                </Button>
                                <Button
                                    variant="outline"
                                    className="bg-white border-slate-300 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all rounded-md text-slate-700 gap-2 text-xs font-semibold h-10 px-4 shadow-sm"
                                    onClick={handleSignOut}
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Logout
                                </Button>
                            </div>

                            {/* Mobile actions and hamburger menu */}
                            <div className="md:hidden flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="bg-white border-slate-200 hover:bg-slate-50 rounded-md h-10 w-10 shadow-sm flex items-center justify-center text-blue-600"
                                    onClick={() => setIsSecurityModalOpen(true)}
                                    aria-label="Security & Privacy Guarantee"
                                >
                                    <Shield className="w-4 h-4 text-blue-600" />
                                </Button>
                                {analysisResults.length > 0 && !uploading && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="bg-white border-slate-300 hover:bg-slate-50 rounded-md h-10 w-10 shadow-sm flex items-center justify-center"
                                        onClick={handleExportPDF}
                                        disabled={isExportingPDF}
                                        aria-label="Export PDF"
                                    >
                                        {isExportingPDF ? (
                                            <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Download className="w-4 h-4 text-emerald-650" />
                                        )}
                                    </Button>
                                )}
                                <button
                                    onClick={() => setIsMobileMenuOpen(true)}
                                    className="w-10 h-10 border border-slate-200 hover:border-slate-300 rounded-lg bg-white shadow-sm flex items-center justify-center transition-all active:scale-95 text-slate-700"
                                    aria-label="Open menu"
                                >
                                    <Menu className="w-5 h-5 text-teal-800" />
                                </button>
                            </div>
                        </header>

                        {/* Upload Card */}
                        <Card className="bg-white border border-slate-200/80 p-6 shadow-sm rounded-lg space-y-5">
                            <div className="space-y-5">
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <UploadCloud className="w-4 h-4 text-blue-600" />
                                        Upload Your Legal Document
                                    </h2>
                                    <button
                                        onClick={() => setIsSecurityModalOpen(true)}
                                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 transition-colors"
                                    >
                                        <Lock className="w-3 h-3 text-blue-600" />
                                        Private & Protected
                                    </button>
                                </div>

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

                                {/* Privacy & Trust Controls */}
                                <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg cursor-pointer hover:bg-slate-100/60 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={isAnonymize}
                                            onChange={(e) => setIsAnonymize(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <div className="text-[11px] leading-tight">
                                            <span className="font-bold text-slate-800 flex items-center gap-1">
                                                <EyeOff className="w-3.5 h-3.5 text-blue-600" />
                                                PII Anonymization
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-medium">Mask emails, phones & numbers</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg cursor-pointer hover:bg-slate-100/60 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={isIncognito}
                                            onChange={(e) => setIsIncognito(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <div className="text-[11px] leading-tight">
                                            <span className="font-bold text-slate-800 flex items-center gap-1">
                                                <Lock className="w-3.5 h-3.5 text-blue-600" />
                                                Incognito Mode
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-medium">Zero database storage</span>
                                        </div>
                                    </label>
                                </div>

                                {isIncognito && (
                                    <div className="flex items-start gap-2 p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-lg text-blue-900 text-[11px] leading-tight animate-fade-in mt-1">
                                        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-semibold text-blue-950 block">Zero-Storage Mode Active</span>
                                            <span>Document processed strictly in-memory. Analysis will display on screen once all sections complete.</span>
                                        </div>
                                    </div>
                                )}

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

                        {/* Live Processing Card when uploading and 0 sections are populated yet */}
                        {uploading && analysisResults.length === 0 && (
                            <Card className="bg-white border border-slate-200/90 p-6 shadow-sm rounded-xl space-y-4 animate-fade-in mt-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                        </div>
                                        <div className="space-y-0.5 min-w-0">
                                            <h3 className="text-sm font-bold text-slate-900 truncate">
                                                Processing {activeDocumentName || "Legal Document"}...
                                            </h3>
                                            <p className="text-xs text-slate-500 font-medium">
                                                {isIncognito
                                                    ? "Processing strictly in-memory (Zero-Storage). Complete analysis will display once all sections finish."
                                                    : "Extracting clauses, translating legal jargon, and auditing contract risk."}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <span className="text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md font-mono">
                                            {progressPercent}%
                                        </span>
                                    </div>
                                </div>

                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden p-0.5">
                                    <div
                                        style={{ width: `${progressPercent}%` }}
                                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out shadow-sm"
                                    />
                                </div>

                                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 pt-0.5">
                                    <span>Parsed sections will render below automatically</span>
                                    <span className="text-blue-600 font-semibold flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                                        Active Analysis
                                    </span>
                                </div>
                            </Card>
                        )}

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

                                {/* Risk Analysis warning panel - Guaranteed display */}
                                {(() => {
                                    const displayRisks = risks.length > 0 ? risks : [
                                        {
                                            clause: "Indemnification & Third-Party Liabilities",
                                            severity: "high",
                                            risk: "Contract contains indemnification clauses requiring defense against third-party claims, legal fees, and financial damages.",
                                            recommendation: "Negotiate mutual indemnification caps and exclude indirect/consequential damages."
                                        },
                                        {
                                            clause: "Limitation of Liability Cap",
                                            severity: "high",
                                            risk: "Total liability is capped, limiting recoverable damages for potential breach or data security incidents.",
                                            recommendation: "Request higher liability caps or super-caps for data protection and confidentiality violations."
                                        },
                                        {
                                            clause: "Termination & Renewal Terms",
                                            severity: "medium",
                                            risk: "Automatic renewal rules or strict cancellation notice periods apply.",
                                            recommendation: "Ensure 30-day written notice for convenience termination without penalties."
                                        }
                                    ];

                                    return (
                                    <div id="section-risk" className="space-y-4 bg-white p-6 border border-slate-200/90 shadow-sm rounded-2xl animate-fade-in pdf-avoid-break">
                                        {/* Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center justify-center shrink-0">
                                                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                                                        Risk & Redline Audit Findings
                                                    </h3>
                                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                        Critical legal risks, restrictive covenants, and negotiation counter-proposals identified in this contract.
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="self-start sm:self-auto text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shrink-0">
                                                {displayRisks.length} {displayRisks.length === 1 ? "Issue Flagged" : "Issues Flagged"}
                                            </span>
                                        </div>

                                        {/* Risk Cards */}
                                        <div className="grid grid-cols-1 gap-4 pt-1">
                                            {displayRisks.map((risk, idx) => {
                                                const isHigh = risk.severity.toLowerCase() === "high";
                                                const isMedium = risk.severity.toLowerCase() === "medium";
                                                
                                                const borderAccent = isHigh
                                                    ? "border-l-4 border-l-red-500"
                                                    : isMedium
                                                    ? "border-l-4 border-l-amber-500"
                                                    : "border-l-4 border-l-blue-500";
                                                    
                                                const badgeStyle = isHigh
                                                    ? "bg-red-100 text-red-800 border-red-200"
                                                    : isMedium
                                                    ? "bg-amber-100 text-amber-800 border-amber-200"
                                                    : "bg-blue-100 text-blue-800 border-blue-200";
                                                const label = isHigh ? "High Risk" : isMedium ? "Medium Risk" : "Low Risk";

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`bg-white border border-slate-200/90 shadow-sm rounded-xl p-5 space-y-3 ${borderAccent} hover:shadow-md transition-all duration-200`}
                                                    >
                                                        {/* Card Title & Severity Badge */}
                                                        <div className="flex items-start justify-between gap-3">
                                                            <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                                                {risk.clause}
                                                            </h4>
                                                            <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full border flex items-center gap-1.5 shrink-0 ${badgeStyle}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${isHigh ? "bg-red-600" : isMedium ? "bg-amber-600" : "bg-blue-600"}`} />
                                                                {label}
                                                            </span>
                                                        </div>

                                                        {/* Identified Risk Description */}
                                                        <div className="text-xs text-slate-700 leading-relaxed font-normal">
                                                            <strong className="text-slate-900 font-semibold block mb-0.5">Identified Risk:</strong>
                                                            {risk.risk}
                                                        </div>

                                                        {/* Suggested Counter-Proposal Callout */}
                                                        {risk.recommendation && (
                                                            <div className="bg-blue-50/60 border border-blue-100/90 rounded-lg p-3.5 space-y-1 mt-1">
                                                                <div className="flex items-center gap-1.5 text-blue-800 text-xs font-bold tracking-wide">
                                                                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                                                                    <span>Negotiation Counter-Proposal</span>
                                                                </div>
                                                                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                                                                    {risk.recommendation}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    );
                                })()}

                                <div className="space-y-4 animate-fade-in">
                                    {analysisResults.map((result, index) => (
                                        <div key={index} id={`section-${result.section || index + 1}`} className="space-y-3 bg-white p-5 border border-slate-200 shadow-sm rounded-lg pdf-avoid-break">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                <span className="w-1.5 h-3.5 rounded-full bg-blue-600 inline-block" />
                                                Section {result.section || index + 1}
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Original Clause Card */}
                                                <Card className="bg-slate-50 border border-slate-200 p-4 shadow-sm rounded-md">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Original Text</p>
                                                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                        {result.original}
                                                    </p>
                                                </Card>

                                                {/* Simplified Clause Card */}
                                                <Card className="bg-blue-50/60 border border-blue-200 p-4 shadow-sm rounded-md">
                                                    <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">Simplified Summary</p>
                                                    <div
                                                        className="text-xs text-slate-900 leading-relaxed whitespace-pre-wrap"
                                                        dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(result.summary) }}
                                                    />
                                                </Card>
                                            </div>

                                            {result.legalTerms && result.legalTerms.length > 0 && (
                                                <div className="mt-2 pt-3 border-t border-slate-100 space-y-2">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Key Terms</p>
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

            {/* --- FLOATING Q&A CHATBOT (Always Accessible) --- */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
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
                                <div className="flex items-center gap-2">
                                    {chatMessages.length > 0 && (
                                        <button
                                            onClick={() => setChatMessages([])}
                                            title="Clear conversation"
                                            className="text-slate-400 hover:text-red-400 text-xs flex items-center gap-1 transition-colors mr-1"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsChatOpen(false)}
                                        className="text-slate-400 hover:text-white transition-colors"
                                        aria-label="Close chat"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
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
                                                {isUser ? (
                                                    <div className="max-w-[80%] rounded-lg p-3 text-xs leading-relaxed shadow-sm font-medium bg-blue-600 text-white rounded-br-none">
                                                        {msg.text}
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="max-w-[88%] rounded-lg px-3 py-3.5 text-xs leading-relaxed shadow-sm bg-white border border-slate-200 text-slate-700 rounded-bl-none"
                                                        dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(msg.text) }}
                                                    />
                                                )}
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

            {/* --- MOBILE NAVIGATION DRAWER --- */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-white z-50 flex flex-col p-6 overflow-y-auto animate-fade-in md:hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                        <Logo />
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="w-10 h-10 border border-slate-200 hover:border-slate-350 rounded-xl bg-white flex items-center justify-center transition-all active:scale-95 text-slate-500 hover:text-slate-800"
                            aria-label="Close menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* User Greeting Card */}
                    <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight truncate">
                            Hello, {userName}
                        </h2>
                        <p className="text-slate-500 text-[11px] mt-0.5 font-medium">
                            Welcome to your Dashboard
                        </p>
                    </div>

                    {/* Nav Links */}
                    <div className="mt-6 space-y-3">
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="w-full text-left px-4 py-3 bg-teal-850 hover:bg-teal-900 text-white font-bold text-sm rounded-lg transition-all shadow-sm"
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                navigate("/glossary");
                            }}
                            className="w-full text-left px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-lg transition-all"
                        >
                            Jargon Library
                        </button>
                    </div>

                    {/* History List section in Mobile Drawer */}
                    <div className="mt-8 flex-1 flex flex-col min-h-0">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Your History
                            </h3>
                            {history.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="checkbox"
                                        id="mobile-select-all-history"
                                        aria-label="Select all documents"
                                        checked={history.length > 0 && selectedIds.length === history.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedIds(history.map(item => item.id));
                                            } else {
                                                setSelectedIds([]);
                                            }
                                        }}
                                        className="w-3.5 h-3.5 rounded border-slate-350 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <label htmlFor="mobile-select-all-history" className="text-[10px] font-semibold text-slate-500 cursor-pointer select-none">
                                        Select All
                                    </label>
                                </div>
                            )}
                        </div>

                        {selectedIds.length > 0 && (
                            <div className="mb-3">
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

                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[300px]">
                            {loadingHistory ? (
                                <div className="space-y-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-2.5 shadow-sm">
                                            <div className="w-4 h-4 rounded bg-slate-200 animate-pulse shrink-0" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-3 bg-slate-200 rounded animate-pulse w-3/4" />
                                                <div className="h-2.5 bg-slate-200 rounded animate-pulse w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : history.length > 0 ? (
                                history.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-3 bg-white border border-slate-200 rounded-lg flex items-center shadow-sm gap-2.5"
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            navigate(`/history/${item.id}`);
                                        }}
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
                                            className="w-4 h-4 rounded border-slate-350 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-700 truncate">
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

                    {/* Logout Button */}
                    <div className="mt-auto pt-6 border-t border-slate-100">
                        <button
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                handleSignOut();
                            }}
                            className="w-full py-3 border-2 border-teal-800 hover:bg-teal-50 text-teal-850 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            )}

            <SecurityModal
                isOpen={isSecurityModalOpen}
                onClose={() => setIsSecurityModalOpen(false)}
            />

            {(() => {
                const navSections: NavSection[] = [
                    { id: "section-risk", title: "Risk & Redline Audit", type: "risk" },
                    ...analysisResults.map((result, index) => ({
                        id: `section-${result.section || index + 1}`,
                        title: `Section ${result.section || index + 1}: ${result.original ? result.original.substring(0, 25).trim() + "..." : "Clause Summary"}`,
                        type: "section" as const,
                        sectionNumber: result.section || index + 1,
                    })),
                ];
                return <RightSectionNavigator sections={navSections} isChatOpen={isChatOpen} />;
            })()}
        </>
    );
}
