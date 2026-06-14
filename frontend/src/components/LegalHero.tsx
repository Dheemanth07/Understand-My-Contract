// src/components/LegalHero.tsx
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Shield, Sparkles } from "lucide-react";

const LegalHero = () => {
    return (
        <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 flex items-center justify-center bg-gradient-hero border-b border-slate-200/50 overflow-hidden">
            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                <div className="space-y-6">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3.5 py-1 text-xs font-semibold text-blue-800 tracking-wide">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        AI-Powered Legal Simplification
                    </div>

                    {/* Heading */}
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                        Simplify Complex <br />
                        <span className="text-blue-600">
                            Legal Documents
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Transform confusing legal jargon into plain, actionable English. Upload any contract or agreement to instantly view side-by-side explanations and definitions.
                    </p>

                    {/* CTA Buttons */}
                    <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <a href="/signup">
                            <Button
                                size="lg"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-6 rounded-md transition-all duration-200 gap-2 text-base shadow-sm"
                            >
                                Get Started Free
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </a>
                        <a href="#see-in-action">
                            <Button
                                variant="outline"
                                size="lg"
                                className="border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold px-8 py-6 rounded-md transition-all duration-200 gap-2 text-base shadow-sm"
                            >
                                <FileText className="w-4 h-4 text-slate-500" />
                                See Demo
                            </Button>
                        </a>
                    </div>

                    {/* Trust elements / features */}
                    <div className="pt-10 flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-blue-600/80" />
                            <span>100% Secure & Confidential</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600/80" />
                            <span>Clause-by-Clause Analysis</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LegalHero;
