import React from "react";
import { Shield, Lock, EyeOff, Trash2, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SecurityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white border border-slate-200/90 shadow-xl rounded-2xl max-w-lg w-full p-6 space-y-5 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
                        <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                            Data Privacy & Trust Guarantee
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                            How LegalSimplify protects your confidential contracts & personal data.
                        </p>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="space-y-3.5 pt-1">
                    <div className="flex items-start gap-3 p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                        <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-slate-900">In-Memory File Buffer Processing</h4>
                            <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                                Uploaded documents are read strictly into RAM memory and deleted immediately after text extraction. Files are <strong>never stored on disk</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                        <EyeOff className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-slate-900">Automatic PII Masking & Redaction</h4>
                            <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                                Personal emails, phone numbers, tax IDs, and monetary values are automatically sanitized (<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">[REDACTED]</code>) before sending text to AI endpoints.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-slate-900">Zero AI Model Training</h4>
                            <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                                We utilize enterprise AI endpoints with Zero Data Retention policies. Your contract content is <strong>never used to train public AI models</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                        <Trash2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-slate-900">Zero-Storage Incognito & Purge</h4>
                            <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                                Enable <strong>Incognito Mode</strong> for ephemeral in-memory processing without saving any history, or hard-purge saved documents anytime.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Button */}
                <div className="pt-2">
                    <Button
                        onClick={onClose}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs h-10 shadow-sm"
                    >
                        Understood & Protected
                    </Button>
                </div>
            </div>
        </div>
    );
};
