// src/components/FeatureSection.tsx
import { Card } from "@/components/ui/card";
import { Upload, Brain, FileText, Globe, Shield, Clock } from "lucide-react";

const features = [
    {
        icon: Upload,
        title: "Drag & Drop Upload",
        description:
            "Supports PDF, Word (DOCX), or text agreements up to 10MB. Instant document parsing with automatic layout retention.",
        accent: "bg-blue-50 text-blue-700 border-blue-100",
    },
    {
        icon: Brain,
        title: "Clause-by-Clause AI Breakdown",
        description:
            "Powered by Google Gemini to analyze dense legal obligations, warranties, and indemnity terms into clear plain language.",
        accent: "bg-slate-100 text-slate-800 border-slate-200",
    },
    {
        icon: FileText,
        title: "Parallel Clause Inspector",
        description:
            "View original contract text side-by-side with simplified explanations. Spot hidden risks and ambiguities at a glance.",
        accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    {
        icon: Globe,
        title: "Automatic Jargon Glossary",
        description:
            "Auto-extracts legal terms like indemnification, liquidated damages, and force majeure into an interactive term dictionary.",
        accent: "bg-amber-50 text-amber-800 border-amber-100",
    },
    {
        icon: Shield,
        title: "Bank-Grade Encryption",
        description:
            "Documents are encrypted in transit and at rest with Supabase security controls. Your files remain strictly private.",
        accent: "bg-indigo-50 text-indigo-700 border-indigo-100",
    },
    {
        icon: Clock,
        title: "Instant Export & Chat",
        description:
            "Ask follow-up questions to your document in real-time and export executive summary PDFs for team or legal counsel review.",
        accent: "bg-sky-50 text-sky-700 border-sky-100",
    },
];

const FeatureSection = () => {
    return (
        <section className="py-20 md:py-28 bg-white relative">
            <div className="max-w-6xl mx-auto px-6">
                
                {/* Section Header */}
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <p className="lp-fadeup text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">
                        Built for Anyone Reading a Contract
                    </p>
                    <h2
                        className="lp-fadeup text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4"
                        style={{ "--fd": "0.08s" } as React.CSSProperties}
                    >
                        Understand Legal Documents <br />
                        <span className="font-serif italic font-normal text-slate-600">Without Spending Hours on Legalese.</span>
                    </h2>
                    <p
                        className="lp-fadeup text-base text-slate-500 leading-relaxed"
                        style={{ "--fd": "0.15s" } as React.CSSProperties}
                    >
                        Whether you are signing a lease, employment agreement, service contract, or NDA — LegalSimplify translates complex clauses into clear, plain language.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="lp-fadeup"
                            style={{ "--fd": `${index * 0.06}s` } as React.CSSProperties}
                        >
                            <Card className="bg-slate-50/50 hover:bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group">
                                <div className="space-y-4">
                                    {/* Icon */}
                                    <div
                                        className={`w-10 h-10 rounded-xl ${feature.accent} border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}
                                    >
                                        <feature.icon className="w-5 h-5" />
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-2">
                                        <h3 className="text-base font-bold text-slate-900">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>

                {/* Process Steps */}
                <div className="mt-24 border-t border-slate-200/80 pt-20">
                    <div className="text-center mb-14">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Simple 3-Step Process</span>
                        <h3 className="lp-fadeup text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
                            How You Go From Document to Plain English Insights
                        </h3>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
                        {[
                            {
                                num: "01",
                                title: "Upload Contract",
                                desc: "Drag and drop your PDF or text contract file directly into your dashboard.",
                            },
                            {
                                num: "02",
                                title: "Clause Simplification",
                                desc: "The AI parses clauses line-by-line, highlighting key obligations and risk flags.",
                            },
                            {
                                num: "03",
                                title: "Review & Ask Questions",
                                desc: "Explore side-by-side explanations, look up jargon terms, and chat with your document.",
                            },
                        ].map((step, i) => (
                            <div
                                key={step.num}
                                className="lp-fadeup relative flex flex-col items-start p-6 bg-white border border-slate-200 rounded-2xl shadow-xs"
                                style={{ "--fd": `${i * 0.1}s` } as React.CSSProperties}
                            >
                                <span className="font-mono text-2xl font-extrabold text-blue-600 mb-3">
                                    {step.num}
                                </span>
                                <h4 className="text-base font-bold text-slate-900 mb-2">{step.title}</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
};

export default FeatureSection;
