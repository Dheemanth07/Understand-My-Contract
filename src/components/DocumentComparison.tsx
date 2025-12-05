// src/components/DocumentComparison.tsx

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// ... Keep your interfaces (SectionResult, Glossary) here ...

// ... Keep the mockDocument data here ...

interface DocumentComparisonProps {
    results?: SectionResult[];
    glossary?: Glossary;
    isDemo?: boolean; // 👈 Add this new prop
}

const DocumentComparison = ({
    results = [],
    glossary = {},
    isDemo = false, // Default to false so it doesn't show up in Dashboard
}: DocumentComparisonProps) => {
    
    // 1. LOGIC: Determine what to show
    let displayData: any[] = [];

    if (results.length > 0) {
        // Case A: We have real results (Dashboard)
        displayData = results;
    } else if (isDemo) {
        // Case B: We are on Landing Page (Show Mock Data)
        displayData = mockDocument.sections.map(section => ({
            section: section.id,
            original: section.original,
            summary: section.simplified,
            legalTerms: section.legalTerms
        }));
    } else {
        // Case C: Dashboard is empty (User hasn't uploaded yet) -> RENDER NOTHING
        return null; 
    }

    // ... Keep your helper function 'renderOriginalWithTooltips' exactly as is ...
    const renderOriginalWithTooltips = (
        originalText: string,
        sectionTerms: { term: string; definition: string }[]
    ) => {
        // ... (paste your existing helper logic here) ...
        // Sort terms by length...
        // Replace with spans...
        // Return div...
        // (If you need me to paste the full helper again, let me know)
        const sortedTerms = [...sectionTerms].sort((a, b) => b.term.length - a.term.length);
        let textWithTooltips = originalText;
        sortedTerms.forEach(({ term, definition }) => {
            const regex = new RegExp(`\\b(${term})\\b`, "gi");
            textWithTooltips = textWithTooltips.replace(
                regex,
                `<span class="font-bold text-blue-600 cursor-pointer underline decoration-dotted decoration-blue-400" title="${definition}">$1</span>`
            );
        });
        return <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: textWithTooltips }} />;
    };

    return (
        <section id="document-comparison" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        {isDemo ? "See It In Action" : "Analysis Results"}
                    </h2>
                    <p className="text-xl text-gray-600">
                        {isDemo
                            ? "This is an example of how we simplify complex legal agreements."
                            : "Here is the simplified breakdown of your uploaded document."}
                    </p>
                </div>

                {/* Only show Legend in Demo mode or if we have results */}
                <div className="flex justify-center gap-6 mb-8 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                        <span>Hover over blue text for definitions</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Original Document Column */}
                    <div>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-2xl font-semibold text-gray-800">Original Legal Text</h3>
                            <Badge variant="outline">Complex</Badge>
                        </div>
                        <Card className="p-6 bg-gray-50 border-l-4 border-gray-300 shadow-sm h-[600px] overflow-y-auto">
                            <div className="space-y-8">
                                <TooltipProvider>
                                    {displayData.map((result) => (
                                        <div key={`original-${result.section}`} className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                                            <h4 className="font-bold text-gray-400 text-sm uppercase tracking-wider mb-3">
                                                Section {result.section}
                                            </h4>
                                            {renderOriginalWithTooltips(
                                                result.original,
                                                result.legalTerms
                                            )}
                                        </div>
                                    ))}
                                </TooltipProvider>
                            </div>
                        </Card>
                    </div>

                    {/* Simplified Document Column */}
                    <div>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-2xl font-semibold text-blue-600">Simplified Summary</h3>
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Plain English</Badge>
                        </div>
                        <Card className="p-6 bg-blue-50/50 border-l-4 border-blue-500 shadow-sm h-[600px] overflow-y-auto">
                            <div className="space-y-8">
                                {displayData.map((result) => (
                                    <div key={`summary-${result.section}`} className="p-4 bg-white rounded-lg shadow-sm border border-blue-100">
                                        <h4 className="font-bold text-blue-400 text-sm uppercase tracking-wider mb-3">
                                            Section {result.section}
                                        </h4>
                                        <div className="flex gap-3">
                                            <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
                                            <p className="text-gray-800 leading-relaxed">
                                                {result.summary}
                                            </p>
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