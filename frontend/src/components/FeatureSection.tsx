import { Card } from "@/components/ui/card";
import { Upload, Brain, FileText, Globe, Shield, Clock } from "lucide-react";
import DocumentComparison from "./DocumentComparison";

const features = [
    {
        icon: Upload,
        title: "Easy Upload",
        description:
            "Simply drag and drop your PDF documents or browse to select files. Supports contracts, agreements, and legal documents.",
        color: "bg-blue-50 text-blue-600",
    },
    {
        icon: Brain,
        title: "AI-Powered Analysis",
        description:
            "Advanced natural language processing identifies complex legal terms and translates them into plain English.",
        color: "bg-purple-50 text-purple-600",
    },
    {
        icon: FileText,
        title: "Side-by-Side Comparison",
        description:
            "View original and simplified text together. Navigate clause by clause to understand every detail.",
        color: "bg-green-50 text-green-600",
    },
    {
        icon: Globe,
        title: "Interactive Glossary",
        description:
            "Hover over highlighted terms for instant definitions and explanations in simple language.",
        color: "bg-orange-50 text-orange-600",
    },
    {
        icon: Shield,
        title: "Secure & Private",
        description:
            "Your documents are processed securely and never stored. Complete privacy guaranteed.",
        color: "bg-red-50 text-red-600",
    },
    {
        icon: Clock,
        title: "Instant Results",
        description:
            "Get your simplified document in seconds, not hours. Perfect for time-sensitive legal reviews.",
        color: "bg-indigo-50 text-indigo-600",
    },
];

const FeatureSection = () => {
    return (
        <section className="py-20 bg-background">
            <div className="max-w-6xl mx-auto px-6">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-legal-dark mb-6">
                        How It <span className="text-legal-primary">Works</span>
                    </h2>
                    <p className="text-xl text-legal-muted max-w-3xl mx-auto leading-relaxed">
                        Our intelligent platform breaks down complex legal
                        language into clear, understandable terms that anyone
                        can comprehend.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <Card
                            key={index}
                            className="p-8 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105 group"
                        >
                            <div className="space-y-4">
                                {/* Icon */}
                                <div
                                    className={`w-16 h-16 rounded-xl ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                                >
                                    <feature.icon className="w-8 h-8" />
                                </div>

                                {/* Content */}
                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold text-legal-dark group-hover:text-legal-primary transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-legal-muted leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Process Steps */}
                <div className="mt-20">
                    <h3 className="text-3xl font-bold text-center text-legal-dark mb-12">
                        Simple 3-Step Process
                    </h3>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                        {/* Step 1 */}
                        <div className="flex flex-col items-center text-center max-w-xs">
                            <div className="w-16 h-16 bg-legal-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                                1
                            </div>
                            <h4 className="text-xl font-semibold text-legal-dark mb-2">
                                Upload
                            </h4>
                            <p className="text-legal-muted">
                                Upload your legal document in PDF format
                            </p>
                        </div>

                        {/* Arrow */}
                        <div className="hidden md:block text-legal-muted">
                            <svg
                                className="w-8 h-8"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center text-center max-w-xs">
                            <div className="w-16 h-16 bg-legal-secondary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                                2
                            </div>
                            <h4 className="text-xl font-semibold text-legal-dark mb-2">
                                Process
                            </h4>
                            <p className="text-legal-muted">
                                Our AI analyzes and simplifies the content
                            </p>
                        </div>

                        {/* Arrow */}
                        <div className="hidden md:block text-legal-muted">
                            <svg
                                className="w-8 h-8"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center text-center max-w-xs">
                            <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                                3
                            </div>
                            <h4 className="text-xl font-semibold text-legal-dark mb-2">
                                Review
                            </h4>
                            <p className="text-legal-muted">
                                Get your side-by-side simplified document
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeatureSection;
