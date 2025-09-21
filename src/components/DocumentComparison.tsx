import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileText, Info, Download, Share2, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "react-router-dom";

interface SectionResult {
    section: number;
    original: string;
    summary: string;
    legalTerms: { term: string; definition: string }[];
}
// -------------------- Helper --------------------
const highlightLegalTerms = (
    text: string,
    terms: Array<{ term: string; definition: string }>
) => {
    if (!terms) return text;
    let highlightedText = text;
    terms.forEach(({ term }) => {
        const regex = new RegExp(
            `\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
            "gi"
        );
        highlightedText = highlightedText.replace(
            regex,
            `<span class="legal-term" data-term="${term}">$&</span>`
        );
    });
    return highlightedText;
};

interface Glossary {
    [key: string]: string;
}
// Mock data for demonstration
const mockDocument = {
    title: "Software License Agreement",
    sections: [
        {
            id: 1,
            title: "Grant of License",
            original:
                "Subject to the terms and conditions of this Agreement, including without limitation the payment of applicable license fees, Licensor hereby grants to Licensee a non-exclusive, non-transferable, limited license to use the Software in accordance with the Documentation solely for Licensee's internal business purposes during the Term.",
            simplified:
                "We give you permission to use our software for your business, but you can't share it with others or sell it. You need to pay the license fees and follow our rules. This permission lasts only as long as this agreement is valid.",
            legalTerms: [
                {
                    term: "non-exclusive",
                    definition:
                        "You're not the only one who can use this software - we can give licenses to other people too.",
                },
                {
                    term: "non-transferable",
                    definition:
                        "You can't give or sell this license to someone else.",
                },
                {
                    term: "limited license",
                    definition:
                        "You can only use the software in specific ways that we allow.",
                },
            ],
        },
        {
            id: 2,
            title: "Restrictions",
            original:
                "Licensee shall not, and shall not permit any third party to: (a) modify, adapt, alter, translate, or create derivative works based upon the Software; (b) reverse engineer, disassemble, decompile, or otherwise attempt to derive the source code of the Software; (c) distribute, sell, sublicense, rent, lease, or otherwise transfer the Software to any third party.",
            simplified:
                "You cannot and cannot let others: (a) change or modify the software in any way; (b) try to figure out how the software works by taking it apart; (c) give, sell, or rent the software to anyone else.",
            legalTerms: [
                {
                    term: "derivative works",
                    definition:
                        "New creations based on existing copyrighted material.",
                },
                {
                    term: "reverse engineer",
                    definition:
                        "Taking apart software to understand how it works.",
                },
                {
                    term: "sublicense",
                    definition:
                        "Giving someone else permission to use something you have a license for.",
                },
            ],
        },
    ],
};

interface DocumentComparisonProps {
    results: SectionResult[];
    glossary: Glossary;
}

const DocumentComparison = ({ results, glossary }: DocumentComparisonProps) => {
    if (results.length === 0) {
        return null; // Don't render anything if there are no results yet
    }

    // A helper to render original text with highlighted tooltips for legal terms
    const renderOriginalWithTooltips = (
        originalText: string,
        sectionTerms: { term: string; definition: string }[]
    ) => {
        let textWithTooltips = originalText;
        sectionTerms.forEach(({ term, definition }) => {
            const regex = new RegExp(`\\b(${term})\\b`, "gi");
            textWithTooltips = textWithTooltips.replace(
                regex,
                `<span class="font-bold text-blue-600 cursor-pointer" title="${definition}">${term}</span>`
            );
        });
        return (
            <p
                dangerouslySetInnerHTML={{
                    __html: textWithTooltips.replace(/\n/g, "<br />"),
                }}
            />
        );
    };

    return (
        <section id="document-comparison" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold">Simplified Document</h2>
                    <p className="text-xl text-gray-600">
                        Here is the side-by-side comparison of your document.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Original Document Column */}
                    <div>
                        <h3 className="text-2xl font-semibold mb-4 text-center">
                            Original Text
                        </h3>
                        <Card className="p-6 bg-gray-50 space-y-6 max-h-[80vh] overflow-y-auto">
                            <TooltipProvider>
                                {results.map((result) => (
                                    <div key={`original-${result.section}`}>
                                        <h4 className="font-bold text-lg mb-2">
                                            Section {result.section}
                                        </h4>
                                        {renderOriginalWithTooltips(
                                            result.original,
                                            result.legalTerms
                                        )}
                                    </div>
                                ))}
                            </TooltipProvider>
                        </Card>
                    </div>

                    {/* Simplified Document Column */}
                    <div>
                        <h3 className="text-2xl font-semibold mb-4 text-center">
                            Simplified Summary
                        </h3>
                        <Card className="p-6 bg-blue-50 space-y-6 max-h-[80vh] overflow-y-auto">
                            {results.map((result) => (
                                <div key={`summary-${result.section}`}>
                                    <h4 className="font-bold text-lg mb-2">
                                        Section {result.section}
                                    </h4>
                                    <p className="whitespace-pre-wrap">
                                        {result.summary}
                                    </p>
                                </div>
                            ))}
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DocumentComparison;
