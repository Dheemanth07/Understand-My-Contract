// src/components/LegalHero.tsx
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Shield, Sparkles, Scale, CheckCircle2, AlertTriangle, AlertCircle, Check } from "lucide-react";

function useFadeup() {
    useEffect(() => {
        const els = document.querySelectorAll<HTMLElement>(".lp-fadeup");
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add("in-view");
                        obs.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.12 }
        );
        els.forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, []);
}

const LegalHero = () => {
    useFadeup();

    return (
        <section className="relative pt-28 pb-20 md:pt-36 md:pb-24 overflow-hidden bg-slate-50/50">
            {/* Subtle Architectural Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

            <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

                {/* ── Left: Copy (5 cols) ─────────────────────────────────── */}
                <div className="lg:col-span-6 space-y-6 text-left">
                    {/* Badge */}
                    <div
                        className="lp-fadeup inline-flex items-center gap-2.5 bg-slate-900 text-slate-100 rounded-full px-3.5 py-1.5 text-xs font-medium tracking-wide shadow-sm"
                        style={{ "--fd": "0s" } as React.CSSProperties}
                    >
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        <span>Contract Intelligence Studio</span>
                        <span className="text-slate-400 font-mono text-[11px] border-l border-slate-700 pl-2">v2.4</span>
                    </div>

                    {/* Editorial Heading */}
                    <h1
                        className="lp-fadeup text-4xl sm:text-5xl lg:text-[2.75rem] xl:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.12]"
                        style={{ "--fd": "0.08s" } as React.CSSProperties}
                    >
                        Review every clause <br />
                        <span className="font-serif italic font-normal text-blue-600">with complete clarity.</span>
                    </h1>

                    {/* Subtitle */}
                    <p
                        className="lp-fadeup text-base md:text-lg text-slate-600 leading-relaxed max-w-lg"
                        style={{ "--fd": "0.15s" } as React.CSSProperties}
                    >
                        LegalSimplify analyzes enterprise contracts line-by-line, surfacing hidden liabilities, non-solicit traps, and translating dense legalese into plain English.
                    </p>

                    {/* CTA Buttons */}
                    <div
                        className="lp-fadeup flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center pt-2"
                        style={{ "--fd": "0.22s" } as React.CSSProperties}
                    >
                        <a href="/signup" className="no-underline">
                            <Button
                                size="lg"
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3 rounded-full transition-all duration-200 gap-2 text-sm shadow-md shadow-blue-600/15"
                            >
                                Start Free Analysis
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </a>
                        <a href="#see-in-action" className="no-underline">
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full sm:w-auto border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold px-7 py-3 rounded-full transition-all duration-200 gap-2 text-sm"
                            >
                                <Scale className="w-4 h-4 text-slate-500" />
                                Explore Demo Report
                            </Button>
                        </a>
                    </div>

                    {/* Trust Signals */}
                    <div
                        className="lp-fadeup flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-500 pt-3 border-t border-slate-200/80"
                        style={{ "--fd": "0.3s" } as React.CSSProperties}
                    >
                        {[
                            { icon: Shield, text: "End-to-End Encrypted" },
                            { icon: CheckCircle2, text: "Supports PDF, DOCX, TXT" },
                            { icon: FileText, text: "Instant Clause Breakdown" }
                        ].map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-1.5">
                                <Icon className="w-3.5 h-3.5 text-blue-600" />
                                <span>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Right: Refined Legal SaaS UI Workbench (6 cols) ─────────── */}
                <div
                    className="lg:col-span-6 lp-fadeup relative"
                    style={{ "--fd": "0.2s" } as React.CSSProperties}
                >
                    {/* Main Workspace Frame */}
                    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xl shadow-slate-900/10 overflow-hidden text-left">
                        
                        {/* Workbench Top Bar */}
                        <div className="bg-slate-900 text-slate-300 px-4 py-3 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                                </div>
                                <FileText className="w-3.5 h-3.5 text-blue-400" />
                                <span className="font-mono text-slate-200 text-[11px] truncate max-w-[210px]">
                                    Enterprise_SaaS_Agreement_v4.pdf
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Audited
                                </span>
                            </div>
                        </div>

                        {/* Sub Header - Document Meta */}
                        <div className="bg-slate-50 border-b border-slate-200/90 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-500">
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-700 tracking-wider uppercase text-[10px]">
                                    Clause 14.2 &mdash; Indemnification
                                </span>
                                <span className="text-slate-300">|</span>
                                <span className="text-slate-500">Page 7 of 14</span>
                            </div>
                            <span className="font-mono text-slate-400 text-[10px]">Doc ID #892F</span>
                        </div>

                        {/* Interactive Clause Breakdown View */}
                        <div className="p-4 space-y-3.5 bg-white">
                            
                            {/* Side-by-Side Clauses */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                
                                {/* Original Contract Text */}
                                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Original Text</span>
                                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/60 px-1.5 py-0.5 rounded border border-amber-200/80">Legalese</span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 leading-relaxed font-mono bg-white p-2.5 rounded border border-slate-200 text-slate-700">
                                            "Vendor shall defend, indemnify and hold harmless Client against any third-party claims arising from gross negligence..."
                                        </p>
                                    </div>
                                </div>

                                {/* Plain English Translation */}
                                <div className="bg-blue-50/40 rounded-xl p-3.5 border border-blue-100 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Plain English</span>
                                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200/80 flex items-center gap-1">
                                                <Check className="w-3 h-3" /> Clear
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-800 leading-relaxed font-medium bg-white p-2.5 rounded border border-blue-100/80">
                                            The Vendor covers legal costs if a third party sues you due to the Vendor's major mistakes or misconduct.
                                        </p>
                                    </div>
                                </div>

                            </div>

                            {/* Risk Assessment List */}
                            <div className="pt-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                        Risk Flags & Carve-Outs
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">Auto-detected by LegalSimplify AI</span>
                                </div>

                                {/* High Risk Flag */}
                                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-red-50/70 border border-red-200/70 text-xs">
                                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-red-950 text-[11px]">Capped Liability Exception</span>
                                            <span className="text-[9px] font-bold text-red-700 uppercase bg-red-100/90 px-1.5 py-0.5 rounded">High Risk</span>
                                        </div>
                                        <p className="text-[11px] text-red-900/80 mt-0.5 leading-tight">Vendor limits overall payouts to 3 months of fees, excluding data breach claims.</p>
                                    </div>
                                </div>

                                {/* Moderate Risk Flag */}
                                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs">
                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-amber-950 text-[11px]">24-Month Non-Solicit</span>
                                            <span className="text-[9px] font-bold text-amber-800 uppercase bg-amber-100/90 px-1.5 py-0.5 rounded">Moderate</span>
                                        </div>
                                        <p className="text-[11px] text-amber-900/80 mt-0.5 leading-tight">Restricts hiring Vendor staff for 2 years post-contract termination.</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Workbench Bottom Status */}
                        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-600">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-600" />
                                <span className="font-medium text-slate-700">12 Jargon Terms Translated</span>
                            </div>
                            <span className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1">
                                Export Summary Report &rarr;
                            </span>
                        </div>

                    </div>

                    {/* Floating Feature Badge */}
                    <div className="hidden sm:flex absolute -bottom-4 -left-4 bg-slate-900 text-white rounded-xl px-3.5 py-2 border border-slate-800 shadow-xl items-center gap-2.5 text-xs">
                        <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-100 text-[11px]">18 Clauses Parsed in Seconds</p>
                            <p className="text-[10px] text-slate-400">Plain English translations generated</p>
                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
};

export default LegalHero;
