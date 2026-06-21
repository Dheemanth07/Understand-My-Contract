// src/components/DocumentComparison.tsx
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles, AlertCircle } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { formatMarkdownToHtml } from "@/lib/utils";

interface SectionResult {
    section: number;
    original: string;
    summary: string;
    legalTerms: { term: string; definition: string }[];
}

interface Glossary {
    [key: string]: string;
}

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
    results?: SectionResult[];
    glossary?: Glossary;
    isDemo?: boolean;
}

const DocumentComparison = ({
    results = [],
    glossary = {},
    isDemo = false,
}: DocumentComparisonProps) => {
    let displayData: any[] = [];

    if (results.length > 0) {
        displayData = results;
    } else if (isDemo) {
        displayData = mockDocument.sections.map((section) => ({
            section: section.id,
            original: section.original,
            summary: section.simplified,
            legalTerms: section.legalTerms,
        }));
    } else {
        return null;
    }

    const renderOriginalWithTooltips = (
        originalText: string,
        sectionTerms: { term: string; definition: string }[]
    ) => {
        if (!sectionTerms || sectionTerms.length === 0) {
            return <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{originalText}</p>;
        }
        const sortedTerms = [...sectionTerms].sort(
            (a, b) => b.term.length - a.term.length
        );
        let textWithTooltips = originalText;
        sortedTerms.forEach(({ term, definition }) => {
            const regex = new RegExp(`\\b(${term})\\b`, "gi");
            textWithTooltips = textWithTooltips.replace(
                regex,
                `<span class="font-semibold text-blue-700 cursor-pointer underline decoration-dotted decoration-blue-500/60 hover:bg-blue-50 px-0.5 rounded transition-colors" title="${definition}">$1</span>`
            );
        });
        return (
            <div
                className="text-slate-700 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: textWithTooltips }}
            />
        );
    };

    return (
        <section id="see-in-action" className="py-16 bg-slate-50 border-t border-slate-200/60">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-3">
                        {isDemo ? "See It In Action" : "Clause Analysis Results"}
                    </h2>
                    <p className="text-sm md:text-base text-slate-500 max-w-2xl mx-auto">
                        {isDemo
                            ? "Explore this side-by-side example comparing raw legalese with our simple translation."
                            : "Your analyzed clauses are organized in parallel panels for clean viewing."}
                    </p>
                </div>

                <div className="flex justify-center gap-6 mb-8 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-lg border border-slate-200/80 shadow-sm">
                        <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                        <span>Hover over highlighted terms to view instant definitions</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    {/* Original Document Column */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                Original Legal Text
                            </h3>
                            <Badge variant="outline" className="border-slate-300 text-slate-500 text-[10px] rounded-md font-medium">Complex</Badge>
                        </div>
                        <Card className="bg-slate-50 border border-slate-200 p-5 shadow-sm rounded-lg flex-1 h-[450px] overflow-y-auto">
                            <div className="space-y-4">
                                <TooltipProvider>
                                    {displayData.map((result, idx) => (
                                        <div
                                            key={`original-${result.section || idx}`}
                                            className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm"
                                        >
                                            <h4 className="font-bold text-slate-500 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <span className="w-1 h-3.5 rounded-full bg-slate-400 inline-block" />
                                                Section {result.section || idx + 1}
                                            </h4>
                                            {renderOriginalWithTooltips(
                                                result.original,
                                                result.legalTerms || []
                                            )}
                                        </div>
                                    ))}
                                </TooltipProvider>
                            </div>
                        </Card>
                    </div>

                    {/* Simplified Document Column */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-blue-600" />
                                Simplified Translation
                            </h3>
                            <Badge className="bg-blue-50 border border-blue-100 text-blue-800 text-[10px] hover:bg-blue-50 rounded-md font-medium">
                                Plain English
                            </Badge>
                        </div>
                        <Card className="bg-blue-50/60 border border-blue-200 p-5 shadow-sm rounded-lg flex-1 h-[450px] overflow-y-auto">
                            <div className="space-y-4">
                                {displayData.map((result, idx) => (
                                    <div
                                        key={`summary-${result.section || idx}`}
                                        className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm"
                                    >
                                        <h4 className="font-bold text-blue-700 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <span className="w-1 h-3.5 rounded-full bg-blue-500 inline-block" />
                                            Section {result.section || idx + 1}
                                        </h4>
                                        <div className="flex gap-2.5">
                                            <FileText className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1" />
                                            <div 
                                                className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap flex-1"
                                                dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(result.summary) }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DocumentComparison;
