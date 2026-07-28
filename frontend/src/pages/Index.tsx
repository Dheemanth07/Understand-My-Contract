// src/pages/Index.tsx
import { useEffect, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { UserAuth } from "../context/AuthContext";
import Header from "@/components/Header";
import LegalHero from "@/components/LegalHero";
import FeatureSection from "@/components/FeatureSection";
import Footer from "@/components/Footer";
import DocumentComparison from "@/components/DocumentComparison";
import ChatbotButton from "@/components/ChatBotButton";

// ─── Scroll Progress ─────────────────────────────────────────────────────────

function useScrollProgress(ref: React.RefObject<HTMLDivElement | null>) {
    useEffect(() => {
        const bar = ref.current;
        if (!bar) return;
        const onScroll = () => {
            const scrolled = window.scrollY;
            const total = document.body.scrollHeight - window.innerHeight;
            bar.style.transform = `scaleX(${total > 0 ? scrolled / total : 0})`;
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [ref]);
}

// ─── Trust Marquee Data ───────────────────────────────────────────────────────

const trustItems = [
    { label: "Google Gemini AI",      color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Supabase Auth",         color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { label: "PDF Analysis",          color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    { label: "MongoDB Storage",       color: "bg-green-50 text-green-700 border-green-200" },
    { label: "React + Vite",          color: "bg-sky-50 text-sky-700 border-sky-200" },
    { label: "Side-by-Side Clauses",  color: "bg-amber-50 text-amber-700 border-amber-200" },
    { label: "Instant PDF Export",    color: "bg-rose-50 text-rose-700 border-rose-200" },
    { label: "Hugging Face BART",     color: "bg-purple-50 text-purple-700 border-purple-200" },
    { label: "256-bit Encryption",    color: "bg-slate-100 text-slate-700 border-slate-200" },
];

// ─── Component ────────────────────────────────────────────────────────────────

const Index = () => {
    const { session, loading: authLoading } = UserAuth();
    const navigate = useNavigate();
    const progressRef = useRef<HTMLDivElement>(null);
    useScrollProgress(progressRef);

    useEffect(() => {
        if (session) {
            navigate("/dashboard", { replace: true });
        }
    }, [session, navigate]);

    if (session) {
        return <Navigate to="/dashboard" replace />;
    }

    if (authLoading && process.env.NODE_ENV !== "test") {
        return null;
    }

    return (
        <div className="min-h-screen relative bg-white">
            {/* Scroll Progress Bar */}
            <div ref={progressRef} className="scroll-progress" aria-hidden="true" />

            <Header />

            <main>
                <LegalHero />
                <FeatureSection />

                {/* ── Powered By / Trust Marquee ──────────────────────────── */}
                <section className="border-t border-slate-200 bg-white py-14">
                    <p className="lp-fadeup text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
                        Powered By
                    </p>
                    <div className="lp-marquee-wrap">
                        <div className="lp-marquee-track gap-3 px-4">
                            {/* Duplicate for seamless loop */}
                            {[...trustItems, ...trustItems].map(({ label, color }, i) => (
                                <span
                                    key={`${label}-${i}`}
                                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${color} mx-1.5 whitespace-nowrap`}
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Demo Section ────────────────────────────────────────── */}
                <DocumentComparison isDemo={true} />

                {/* ── CTA Banner ──────────────────────────────────────────── */}
                <section className="max-w-6xl mx-auto px-6 py-20">
                    <div className="lp-fadeup bg-slate-900 rounded-3xl px-8 py-16 text-center text-white relative overflow-hidden shadow-2xl shadow-slate-900/10 border border-slate-800">
                        {/* Architectural Accent lines */}
                        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

                        <p className="relative text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">
                            Instant Document Analysis &bull; Free Account
                        </p>
                        <h2 className="relative text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-slate-100">
                            Ready to Simplify Your Next Contract?
                        </h2>
                        <p className="relative text-slate-300 max-w-md mx-auto mb-8 text-sm leading-relaxed">
                            Upload your agreement to get an instant clause-by-clause breakdown, risk assessment, interactive legal glossary, and AI document chat.
                        </p>
                        <a
                            href="/signup"
                            className="relative inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors no-underline shadow-lg shadow-blue-600/25"
                        >
                            Start Free Analysis <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                </section>
            </main>

            <Footer />
            <ChatbotButton />
        </div>
    );
};

export default Index;
