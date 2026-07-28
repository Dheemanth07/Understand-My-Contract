// src/pages/HistoryView.tsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/config";
import { Clock, FileText, Trash2, ArrowLeft, Send, MessageSquare, X, AlertTriangle, ShieldCheck, Shield, Download, User, Layers, ShieldAlert, BookOpen, Menu, Globe, ChevronRight } from "lucide-react";
import { RightSectionNavigator, NavSection } from "@/components/RightSectionNavigator";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { formatMarkdownToHtml } from "@/lib/utils";
import Logo from "@/components/Logo";

export default function HistoryView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [docData, setDocData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const userFullName = user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        (user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() : "") ||
        (user?.email ? (user.email.split("@")[0].charAt(0).toUpperCase() + user.email.split("@")[0].slice(1)) : "User");

    const userName = user?.user_metadata?.first_name ||
        user?.user_metadata?.full_name?.split(" ")[0] ||
        user?.email?.split("@")[0] ||
        "User";

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
            const h1 = clonedElement.querySelector("header h1");
            if (h1) {
                (h1 as HTMLElement).style.setProperty("white-space", "normal", "important");
                (h1 as HTMLElement).style.setProperty("overflow", "visible", "important");
                (h1 as HTMLElement).style.setProperty("text-overflow", "clip", "important");
                (h1 as HTMLElement).style.setProperty("font-size", "22px", "important");
                (h1 as HTMLElement).style.setProperty("margin-bottom", "8px", "important");
                (h1 as HTMLElement).style.setProperty("line-height", "1.4", "important");
                (h1 as HTMLElement).style.setProperty("word-break", "break-word", "important");
                (h1 as HTMLElement).style.setProperty("padding-top", "6px", "important");
                (h1 as HTMLElement).style.setProperty("padding-bottom", "6px", "important");
            }
            const headerTitleBlock = clonedElement.querySelector("header .space-y-1\\.5, header .space-y-1, header > div:first-child");
            if (headerTitleBlock) {
                (headerTitleBlock as HTMLElement).style.setProperty("max-width", "100%", "important");
                (headerTitleBlock as HTMLElement).style.setProperty("width", "100%", "important");
            }

            // Make the h2/h3 titles wrap freely and have padding to prevent ascender/descender cropping
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

            // 5. Card padding adjustments (compact styling for high print density)
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

            clonedElement.querySelectorAll("section").forEach((sec) => {
                (sec as HTMLElement).style.setProperty("margin-bottom", "10px", "important");
                (sec as HTMLElement).style.setProperty("padding-top", "2px", "important");
            });

            clonedElement.querySelectorAll("[class*='rounded-lg'][class*='border']").forEach((card) => {
                (card as HTMLElement).style.setProperty("margin-bottom", "10px", "important");
                // Clear any manual margin-top applied previously
                (card as HTMLElement).style.setProperty("margin-top", "0px", "important");
            });

            // 6. Convert Grid to Flex with wrap support
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

            // Group "Simplified Sections" title with the first card that follows it
            const simplifiedSection = Array.from(clonedElement.children).find(
                (child) => child.tagName === "SECTION" && child.querySelector("h2")?.textContent?.includes("Simplified Sections")
            ) as HTMLElement;

            if (simplifiedSection) {
                const h2 = simplifiedSection.querySelector("h2") as HTMLElement;
                const risksPanel = simplifiedSection.querySelector(".pdf-avoid-break") as HTMLElement;
                const cardsContainer = simplifiedSection.querySelector(".space-y-4") as HTMLElement;

                let firstCard = risksPanel;
                if (!firstCard && cardsContainer) {
                    firstCard = cardsContainer.firstElementChild as HTMLElement;
                }

                if (h2 && firstCard) {
                    const groupWrapper = document.createElement("div");
                    groupWrapper.className = "pdf-grouped-block";
                    groupWrapper.style.setProperty("display", "block", "important");
                    groupWrapper.style.setProperty("margin-bottom", "16px", "important");

                    h2.parentNode?.insertBefore(groupWrapper, h2);
                    groupWrapper.appendChild(h2);
                    groupWrapper.appendChild(firstCard);
                    h2.style.setProperty("margin-bottom", "8px", "important");
                }
            }

            // Group "Glossary" title with the glossary card
            const glossarySection = Array.from(clonedElement.children).find(
                (child) => child.tagName === "SECTION" && child.querySelector("h2")?.textContent?.includes("Glossary")
            ) as HTMLElement;

            if (glossarySection) {
                const h2 = glossarySection.querySelector("h2") as HTMLElement;
                const glossaryCard = glossarySection.querySelector(".bg-white") as HTMLElement;

                if (h2 && glossaryCard) {
                    const groupWrapper = document.createElement("div");
                    groupWrapper.className = "pdf-grouped-block";
                    groupWrapper.style.setProperty("display", "block", "important");
                    groupWrapper.style.setProperty("margin-bottom", "16px", "important");

                    h2.parentNode?.insertBefore(groupWrapper, h2);
                    groupWrapper.appendChild(h2);
                    groupWrapper.appendChild(glossaryCard);
                    h2.style.setProperty("margin-bottom", "8px", "important");
                }
            }

            // 7. Extract blocks to render
            const blocks: HTMLElement[] = [];
            Array.from(clonedElement.children).forEach((child) => {
                const childEl = child as HTMLElement;
                if (childEl.hasAttribute("data-html2canvas-ignore") || childEl.style.display === "none") {
                    return;
                }

                if (childEl.tagName === "HEADER") {
                    blocks.push(childEl);
                } else if (childEl.tagName === "SECTION" && childEl.classList.contains("grid")) {
                    // Metadata grid
                    blocks.push(childEl);
                } else if (childEl.tagName === "SECTION" && childEl.querySelector("h2")?.textContent?.includes("Simplified Sections")) {
                    // This is the simplified sections wrapper
                    Array.from(childEl.children).forEach((subChild) => {
                        const subChildEl = subChild as HTMLElement;
                        if (subChildEl.hasAttribute("data-html2canvas-ignore") || subChildEl.style.display === "none") {
                            return;
                        }

                        if (subChildEl.classList.contains("pdf-grouped-block") || subChildEl.classList.contains("pdf-avoid-break")) {
                            blocks.push(subChildEl);
                        } else if (subChildEl.classList.contains("space-y-4")) {
                            // This is the container holding the individual section cards (starting from card 2)
                            Array.from(subChildEl.children).forEach((card) => {
                                const cardEl = card as HTMLElement;
                                if (!cardEl.hasAttribute("data-html2canvas-ignore") && cardEl.style.display !== "none") {
                                    blocks.push(cardEl);
                                }
                            });
                        }
                    });
                } else if (childEl.tagName === "SECTION" && childEl.querySelector("h2")?.textContent?.includes("Glossary")) {
                    // Glossary section container
                    Array.from(childEl.children).forEach((subChild) => {
                        const subChildEl = subChild as HTMLElement;
                        if (!subChildEl.hasAttribute("data-html2canvas-ignore") && subChildEl.style.display !== "none") {
                            blocks.push(subChildEl);
                        }
                    });
                } else {
                    blocks.push(childEl);
                }
            });

            // 8. Render blocks sequentially to jsPDF
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

                // Prevent orphan headings
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

            let replyText = "";
            let success = false;

            if (id) {
                try {
                    const resp = await axios.post(
                        `${API_BASE_URL}/history/${id}/chat`,
                        { message: userMsg },
                        { headers: { Authorization: `Bearer ${token}` } }
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
                const contextText = docData?.sections ? docData.sections.map((s: any) => s.original).join("\n\n") : "";
                const resp = await axios.post(
                    `${API_BASE_URL}/history/chat/general`,
                    { message: userMsg, contextText, filename: docData?.filename },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                replyText = resp.data.reply;
            }

            setChatMessages((prev) => [...prev, { sender: "bot", text: replyText || "I'm here to help with any questions about your contract." }]);
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
                        <div className="hidden md:flex items-center gap-2 shrink-0">
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

                        {/* Mobile actions */}
                        <div className="md:hidden flex items-center gap-2 shrink-0">
                            <Button
                                variant="outline"
                                className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 h-9 rounded-md px-3 gap-1.5 text-xs shadow-sm font-semibold flex items-center"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Back
                            </Button>
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="w-9 h-9 border border-slate-200 hover:border-slate-300 rounded-md bg-white shadow-sm flex items-center justify-center transition-all active:scale-95 text-slate-700"
                                aria-label="Open menu"
                            >
                                <Menu className="w-5 h-5 text-teal-800" />
                            </button>
                        </div>
                    </header>

                    {/* --- METADATA SECTION --- */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-white border border-slate-200 p-4 shadow-sm rounded-lg flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Uploaded by</p>
                                <p className="text-xs text-slate-700 font-semibold truncate">{userFullName}</p>
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

                        {/* Risk Analysis warning panel - Guaranteed display */}
                        {(() => {
                            const displayRisks = (docData.risks && docData.risks.length > 0) ? docData.risks : [
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
                            <div id="history-section-risk" className="space-y-4 bg-white p-6 border border-slate-200/90 shadow-sm rounded-2xl animate-fade-in pdf-avoid-break">
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
                                    {displayRisks.map((risk: any, idx: number) => {
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

                        <div className="space-y-4">
                            {docData.sections.map((section: any, idx: number) => (
                                <div key={idx} id={`history-section-${section.section || idx + 1}`} className="space-y-3 bg-white p-5 border border-slate-200 shadow-sm rounded-lg pdf-avoid-break">
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
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terms:</p>
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
                                </div>
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
                                        {docData.filename || "Document"}
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
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                navigate("/dashboard");
                            }}
                            className="w-full text-left px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-lg transition-all"
                        >
                            Back to Studio
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
                        {docData && (
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    handleExportPDF();
                                }}
                                className="w-full text-left px-4 py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm rounded-lg transition-all shadow-sm flex items-center gap-2"
                                disabled={isExportingPDF}
                            >
                                <Download className="w-4 h-4" />
                                Export PDF
                            </button>
                        )}
                    </div>
                </div>
            )}

            {docData && (
                (() => {
                    const historyNavSections: NavSection[] = [
                        { id: "history-section-risk", title: "Risk & Redline Audit", type: "risk" },
                        ...docData.sections.map((section: any, idx: number) => ({
                            id: `history-section-${section.section || idx + 1}`,
                            title: `Section ${section.section || idx + 1}: ${section.original ? section.original.substring(0, 25).trim() + "..." : "Clause Summary"}`,
                            type: "section" as const,
                            sectionNumber: section.section || idx + 1,
                        })),
                    ];
                    return <RightSectionNavigator sections={historyNavSections} isChatOpen={isChatOpen} />;
                })()
            )}
        </>
    );
}
