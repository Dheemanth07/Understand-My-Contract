import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Scale,
    Mail,
    Shield,
    FileText,
    Github,
    Twitter,
    Linkedin,
} from "lucide-react";

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
                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-legal-light hover:text-legal-secondary"
                            >
                                <Twitter className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-legal-light hover:text-legal-secondary"
                            >
                                <Linkedin className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-legal-light hover:text-legal-secondary"
                                asChild
                            >
                                <a
                                    href="https://github.com/Dheemanth07/understand-my-contract"
                                    target="_blank"
                                    rel="noopener noreferrer"
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
                        <ul className="space-y-2 text-legal-light/80">
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-legal-secondary transition-colors"
                                >
                                    Document Upload
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-legal-secondary transition-colors"
                                >
                                    AI Analysis
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-legal-secondary transition-colors"
                                >
                                    Side-by-Side View
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-legal-secondary transition-colors"
                                >
                                    Legal Glossary
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-legal-secondary">
                            Resources
                        </h4>
                        <ul className="space-y-2 text-legal-light/80">
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-legal-secondary transition-colors"
                                >
                                    Documentation
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-legal-secondary transition-colors"
                                >
                                    API Reference
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-legal-secondary transition-colors"
                                >
                                    Tutorials
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-legal-secondary transition-colors"
                                >
                                    Best Practices
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-legal-secondary">
                            Support
                        </h4>
                        <ul className="space-y-2 text-legal-light/80">
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-legal-secondary transition-colors"
                                >
                                    Help Center
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-legal-secondary transition-colors"
                                >
                                    Contact Us
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-legal-secondary transition-colors"
                                >
                                    Status Page
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-legal-secondary transition-colors"
                                >
                                    Community
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <Separator className="bg-legal-light/20 mb-8" />

                {/* Bottom Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-legal-light/60">
                        <p>&copy; 2025 LegalSimplify. All rights reserved.</p>
                        <div className="flex gap-4">
                            <a
                                href="#"
                                className="hover:text-legal-secondary transition-colors flex items-center gap-1"
                            >
                                <Shield className="w-3 h-3" />
                                Privacy Policy
                            </a>
                            <a
                                href="#"
                                className="hover:text-legal-secondary transition-colors flex items-center gap-1"
                            >
                                <FileText className="w-3 h-3" />
                                Terms of Service
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
