// src/components/Footer.tsx
import { Scale } from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-white border-t border-slate-200/80 text-slate-500">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Brand */}
                    <div className="flex items-center gap-2.5">
                        <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-100/80 flex items-center justify-center">
                            <Scale className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-lg font-bold text-slate-900 tracking-tight">
                            LegalSimplify
                        </span>
                    </div>

                    {/* Meta */}
                    <p className="text-xs text-slate-400 text-center md:text-right font-medium">
                        &copy; 2026 LegalSimplify. All rights reserved. Secure legal document simplification.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
