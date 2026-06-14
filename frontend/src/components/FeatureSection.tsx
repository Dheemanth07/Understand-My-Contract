// src/components/FeatureSection.tsx
import { Card } from "@/components/ui/card";
import { Upload, Brain, FileText, Globe, Shield, Clock } from "lucide-react";

const features = [
    {
        icon: Upload,
        title: "Easy Upload",
        description:
            "Simply drag and drop your PDF/Word documents or browse to select files. Supports all standard legal contracts and agreement formats.",
        color: "bg-blue-50 text-blue-600 border-blue-100/80",
    },
    {
        icon: Brain,
        title: "AI-Powered Analysis",
        description:
            "Advanced natural language processing identifies complex clauses and translates dense legalese into plain, human-friendly English.",
        color: "bg-indigo-50 text-indigo-600 border-indigo-100/80",
    },
    {
        icon: FileText,
        title: "Side-by-Side Comparison",
        description:
            "Compare original clauses directly next to simplified explanations. Easily spot differences and hidden requirements.",
        color: "bg-emerald-50 text-emerald-600 border-emerald-100/80",
    },
    {
        icon: Globe,
        title: "Interactive Glossary",
        description:
            "Get instant hover tooltips defining complex terminology and legal jargon inline as you read through your document.",
        color: "bg-amber-55 bg-amber-50 text-amber-700 border-amber-100/80",
    },
    {
        icon: Shield,
        title: "Secure & Private",
        description:
            "We prioritize your confidentiality. Uploaded files are processed securely over encrypted channels and never shared.",
        color: "bg-rose-50 text-rose-600 border-rose-100/80",
    },
    {
        icon: Clock,
        title: "Instant Results",
        description:
            "Receive your comprehensive side-by-side analysis within seconds, avoiding long and expensive attorney consult waiting times.",
        color: "bg-sky-50 text-sky-600 border-sky-100/80",
    },
];

const FeatureSection = () => {
    return (
        <section className="py-16 md:py-24 bg-white relative">
            <div className="max-w-6xl mx-auto px-6">
                {/* Section Header */}
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">
                        How It <span className="text-blue-600">Works</span>
                    </h2>
                    <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                        Our platform automatically parses legal documents, highlights confusing sections, and delivers a clear breakdown of responsibilities and terms.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <Card
                            key={index}
                            className="bg-white border border-slate-200/80 p-6 rounded-lg shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-150 flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                {/* Icon */}
                                <div
                                    className={`w-12 h-12 rounded-lg ${feature.color} border flex items-center justify-center`}
                                >
                                    <feature.icon className="w-5 h-5" />
                                </div>

                                {/* Content */}
                                <div className="space-y-2">
                                    <h3 className="text-base font-bold text-slate-900">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Process Steps */}
                <div className="mt-20 md:mt-28 border-t border-slate-200/85 pt-16">
                    <h3 className="text-2xl md:text-3xl font-extrabold text-center text-slate-900 mb-12">
                        Simple 3-Step Process
                    </h3>

                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
                        {/* Step 1 */}
                        <div className="flex flex-col items-center text-center p-6 bg-slate-50 border border-slate-200/60 rounded-lg shadow-sm">
                            <div className="w-10 h-10 bg-blue-100 border border-blue-200 text-blue-800 rounded-full flex items-center justify-center text-base font-bold mb-4">
                                1
                            </div>
                            <h4 className="text-base font-bold text-slate-900 mb-2">
                                Upload Document
                            </h4>
                            <p className="text-sm text-slate-500">
                                Drag & drop your PDF, DOCX, or TXT file into our secure dashboard.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center text-center p-6 bg-slate-50 border border-slate-200/60 rounded-lg shadow-sm">
                            <div className="w-10 h-10 bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-full flex items-center justify-center text-base font-bold mb-4">
                                2
                            </div>
                            <h4 className="text-base font-bold text-slate-900 mb-2">
                                AI Simplification
                            </h4>
                            <p className="text-sm text-slate-500">
                                Our models process and identify dense terminology clause-by-clause.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center text-center p-6 bg-slate-50 border border-slate-200/60 rounded-lg shadow-sm">
                            <div className="w-10 h-10 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-full flex items-center justify-center text-base font-bold mb-4">
                                3
                            </div>
                            <h4 className="text-base font-bold text-slate-900 mb-2">
                                Review & Verify
                            </h4>
                            <p className="text-sm text-slate-500">
                                View side-by-side simplifications and interact with highlighted terms.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeatureSection;
