import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Scale, Shield, FileText, Clock, Github } from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-legal-dark text-legal-light">
            <div className="max-w-7xl mx-auto px-6 py-16">
                {/* Main Footer Content */}
                <div className="grid md:grid-cols-4 gap-8 mb-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Scale className="w-8 h-8 text-legal-secondary" />
                            <span className="text-2xl font-bold">
                                LegalSimplify
                            </span>
                        </div>
                        <p className="text-legal-light/80 leading-relaxed">
                            Making legal documents accessible to everyone
                            through AI-powered simplification.
                        </p>
                        <div className="hidden">
                            <Button
                                variant="ghost"
                                size="sm"
                                aria-label="Open GitHub repository"
                                className="text-legal-light hover:text-legal-secondary"
                                asChild
                            >
                                <a
                                    href="https://github.com/Dheemanth07/understand-my-contract"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Open GitHub repository"
                                >
                                    <Github className="w-4 h-4" />
                                </a>
                            </Button>
                        </div>
                    </div>

                    {/* Product */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-legal-secondary">
                            Product
                        </h4>
                        <p className="text-legal-light/80 leading-relaxed">
                            AI-powered contract simplification. Upload a legal
                            document to get clear summaries, translations, and
                            glossary explanations.
                        </p>

                        <div className="flex gap-3 pt-2">
                            <a
                                href="/"
                                className="inline-flex items-center gap-2 text-legal-light hover:text-legal-secondary transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                App
                            </a>
                            <a
                                href="/history"
                                className="inline-flex items-center gap-2 text-legal-light hover:text-legal-secondary transition-colors"
                            >
                                <Clock className="w-4 h-4" />
                                History
                            </a>
                        </div>
                    </div>

                    {/* Remove placeholder footer links that go to '#' */}
                    <div className="hidden md:block md:col-span-3" />
                </div>
            </div>
        </footer>
    );
};

export default Footer;
