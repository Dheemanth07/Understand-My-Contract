// src/components/Footer.tsx
import { Scale, Github, Linkedin } from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-white border-t border-slate-200/80 text-slate-500">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    {/* Brand */}
                    <div className="flex items-center gap-2.5">
                        <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-100/80 flex items-center justify-center">
                            <Scale className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-lg font-bold text-slate-900 tracking-tight">
                            LegalSimplify
                        </span>
                    </div>

                    {/* Social/Links */}
                    <div className="flex items-center gap-5">
                        <a
                            href="https://github.com/Dheemanth07/Understand-My-Contract"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors font-semibold"
                        >
                            <Github className="w-5 h-5 text-slate-700" />
                            <span>View source on GitHub</span>
                        </a>
                        <a
                            href="https://www.linkedin.com/in/dheemanth-d-522469291"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-7 h-7 rounded bg-[#475569] hover:bg-[#0077b5] text-white flex items-center justify-center transition-colors shadow-sm"
                            aria-label="LinkedIn Profile"
                        >
                            <Linkedin className="w-4 h-4 fill-white" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
