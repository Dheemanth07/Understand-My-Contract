import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, FileText, Layers } from "lucide-react";

export interface NavSection {
    id: string;
    title: string;
    type: "risk" | "section";
    sectionNumber?: number;
}

interface RightSectionNavigatorProps {
    sections: NavSection[];
    isChatOpen?: boolean;
}

export const RightSectionNavigator: React.FC<RightSectionNavigatorProps> = ({ sections, isChatOpen }) => {
    const [activeId, setActiveId] = useState<string>("");
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const navContainerRef = useRef<HTMLDivElement>(null);

    // Track which section is currently in the active viewport
    useEffect(() => {
        if (sections.length === 0) return;

        const handleScroll = () => {
            const scrollPosition = window.scrollY + 200;
            let currentActive = sections[0].id;

            for (const sec of sections) {
                const el = document.getElementById(sec.id);
                if (el) {
                    const top = el.offsetTop;
                    if (scrollPosition >= top - 100) {
                        currentActive = sec.id;
                    }
                }
            }
            setActiveId(currentActive);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // Initial check

        return () => window.removeEventListener("scroll", handleScroll);
    }, [sections]);

    // Keep active dash automatically scrolled into view inside the capped 256px container
    useEffect(() => {
        if (!activeId || !navContainerRef.current) return;
        const activeDash = navContainerRef.current.querySelector(`[data-dash-id="${activeId}"]`);
        if (activeDash) {
            activeDash.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [activeId]);

    if (sections.length === 0 || isChatOpen) return null;

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const isExceedsLimit = sections.length > 30;

    return (
        <div
            className="fixed right-3 top-1/2 -translate-y-1/2 z-30 flex items-center gap-3 animate-fade-in group select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Popover Section List (Appears on Hover / Click) */}
            <div
                className={`transition-all duration-300 transform origin-right ${
                    isHovered
                        ? "opacity-100 scale-100 translate-x-0 pointer-events-auto"
                        : "opacity-0 scale-95 translate-x-4 pointer-events-none"
                }`}
            >
                <div className="bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/80 shadow-2xl rounded-2xl p-3 w-64 max-h-80 overflow-y-auto space-y-1 text-xs custom-scrollbar">
                    <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                        <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-blue-400" />
                            Document Sections
                        </span>
                        <span className="bg-blue-900/60 text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-blue-700/50">
                            {sections.length}
                        </span>
                    </div>

                    {sections.map((sec) => {
                        const isActive = activeId === sec.id;
                        return (
                            <button
                                key={sec.id}
                                onClick={() => scrollToSection(sec.id)}
                                className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between gap-2 text-[11px] leading-tight ${
                                    isActive
                                        ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-900/50"
                                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium"
                                }`}
                            >
                                <span className="truncate flex items-center gap-2">
                                    {sec.type === "risk" ? (
                                        <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-amber-400"}`} />
                                    ) : (
                                        <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-blue-400"}`} />
                                    )}
                                    <span className="truncate">{sec.title}</span>
                                </span>
                                {isActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Transparent Vertical Bar Stack of Horizontal Dashes - Original line sizes (w-5 h-1 gap-1.5), max-h-[300px] limit after 30 sections */}
            <div
                ref={navContainerRef}
                className={`flex flex-col items-center gap-1.5 py-1 px-1 cursor-pointer bg-transparent ${
                    isExceedsLimit
                        ? "max-h-[300px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                        : ""
                }`}
            >
                {sections.map((sec) => {
                    const isActive = activeId === sec.id;
                    return (
                        <button
                            key={sec.id}
                            data-dash-id={sec.id}
                            onClick={() => scrollToSection(sec.id)}
                            title={sec.title}
                            className={`w-5 h-1 rounded-full transition-all duration-200 shrink-0 ${
                                isActive
                                    ? "bg-blue-600 shadow-sm shadow-blue-500/80 scale-110 opacity-100"
                                    : "bg-slate-300 hover:bg-slate-400 opacity-70"
                            }`}
                            aria-label={sec.title}
                        />
                    );
                })}
            </div>
        </div>
    );
};
