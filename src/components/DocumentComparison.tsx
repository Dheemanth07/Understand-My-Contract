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

const activeSections = sections.length > 0 ? sections : mockDocument.sections;

const DocumentComparison = () => {
    const { id } = useParams();

    const [sections, setSections] = useState<any[]>([]);
    const [selectedSection, setSelectedSection] = useState(0);
    const [title, setTitle] = useState<string>(mockDocument.title);
    const [hoveredTerm, setHoveredTerm] = useState<string | null>(null);

    // ✅ Check if logged in
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data?.user ?? null);
        });

        const { data: listener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    // ✅ If viewing a past analysis (/history/:id)
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const res = await fetch(`/history/${id}`);
                if (!res.ok) throw new Error("Failed to load analysis");
                const data = await res.json();

                setTitle(data.filename || "Past Document");
                setSections(data.sections || []);
            } catch (err) {
                console.error("History load failed", err);
            }
        })();
    }, [id]);

    // ✅ SSE stream handler
    const connectSSE = async () => {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session) return;

        const token = session.access_token;
        const evtSource = new EventSource(`/sse?token=${token}`);

        evtSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.done) {
                evtSource.close();
            } else if (data.section) {
                setTitle(data.filename || "Uploaded Document");
                setSections((prev) => [...prev, data]);
            }
        };
        evtSource.onerror = (err) => {
            console.error("SSE connection failed:", err);
            evtSource.close();
        };
    };

    const currentSection =
        sections.length > 0 ? sections[selectedSection] : null;

    return (
        <section id="document-comparison" className="py-20 bg-background">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-legal-dark mb-4">
                        Document
                        <span className="text-legal-primary">Analysis</span>
                    </h2>
                    <p className="text-xl text-legal-muted max-w-3xl mx-auto">
                        Compare the original legal text with our AI-simplified
                        version side by side.
                    </p>
                </div>

                {/* Document Info */}
                <Card className="mb-8 p-6 bg-gradient-card border-0 shadow-soft">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-legal-primary rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-legal-dark">
                                    {title}
                                </h3>
                                <p className="text-legal-muted">
                                    {user
                                        ? `Processed on ${new Date().toLocaleDateString()}`
                                        : "Please log in to process documents."}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                                <Download className="w-4 h-4" />
                                Export
                            </Button>
                            <Button variant="outline" size="sm">
                                <Share2 className="w-4 h-4" />
                                Share
                            </Button>
                            {!id && user && (
                                <Button
                                    variant="legal"
                                    size="sm"
                                    onClick={connectSSE}
                                >
                                    Start Live Stream
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Section Navigation */}
                    <div className="lg:col-span-1">
                        <Card className="p-6 sticky top-6">
                            <h4 className="font-semibold text-legal-dark mb-4 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                Sections
                            </h4>
                            <div className="space-y-2">
                                {activeSections.map((section, index) => (
                                    <button
                                        key={index}
                                        onClick={() =>
                                            setSelectedSection(index)
                                        }
                                        className={`w-full text-left p-3 rounded-lg transition-all ${
                                            selectedSection === index
                                                ? "bg-legal-primary text-white shadow-soft"
                                                : "hover:bg-gray-50 text-legal-muted"
                                        }`}
                                    >
                                        <div className="text-sm font-medium">
                                            Section {index + 1}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Main Comparison */}
                    <div className="lg:col-span-3">
                        {currentSection ? (
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Original Text */}
                                <Card className="p-6 border-l-4 border-l-red-400">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-semibold text-legal-dark flex items-center gap-2">
                                            Original Text
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                Complex
                                            </Badge>
                                        </h4>
                                        <Info className="w-4 h-4 text-legal-muted" />
                                    </div>

                                    <ScrollArea className="h-64">
                                        <TooltipProvider>
                                            <div
                                                className="text-sm text-legal-dark leading-relaxed"
                                                dangerouslySetInnerHTML={{
                                                    __html: highlightLegalTerms(
                                                        currentSection.original,
                                                        currentSection.legalTerms
                                                    ),
                                                }}
                                                onMouseOver={(e) => {
                                                    const target =
                                                        e.target as HTMLElement;
                                                    if (
                                                        target.classList.contains(
                                                            "legal-term"
                                                        )
                                                    ) {
                                                        setHoveredTerm(
                                                            target.dataset
                                                                .term || null
                                                        );
                                                    }
                                                }}
                                                onMouseOut={() =>
                                                    setHoveredTerm(null)
                                                }
                                            />
                                        </TooltipProvider>
                                    </ScrollArea>
                                </Card>

                                {/* Simplified Text */}
                                <Card className="p-6 border-l-4 border-l-green-400">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-semibold text-legal-dark flex items-center gap-2">
                                            Simplified Version
                                            <Badge
                                                variant="secondary"
                                                className="text-xs bg-green-100 text-green-800"
                                            >
                                                Easy
                                            </Badge>
                                        </h4>
                                        <Info className="w-4 h-4 text-legal-muted" />
                                    </div>

                                    <ScrollArea className="h-64">
                                        <p className="text-sm text-legal-dark leading-relaxed">
                                            {currentSection?.summary ||
                                                "Waiting for simplification..."}
                                        </p>
                                    </ScrollArea>
                                </Card>
                            </div>
                        ) : (
                            <p className="text-center text-legal-muted">
                                {id
                                    ? "Loading analysis..."
                                    : "No sections yet. Upload a file to begin."}
                            </p>
                        )}

                        {/* Legal Terms Glossary */}
                        <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
                            <h4 className="font-semibold text-legal-dark mb-4 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                Legal Terms in This Section
                            </h4>

                            <div className="grid md:grid-cols-2 gap-4">
                                {currentSection?.legalTerms?.map(
                                    (term, index) => (
                                        <div
                                            key={index}
                                            className={`p-4 bg-white rounded-lg border transition-all ${
                                                hoveredTerm === term.term
                                                    ? "border-legal-primary shadow-soft scale-105"
                                                    : "border-gray-200"
                                            }`}
                                        >
                                            <h5 className="font-medium text-legal-primary mb-2">
                                                {term.term}
                                            </h5>
                                            <p className="text-sm text-legal-muted">
                                                {term.definition}
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center mt-8">
                    <Button
                        variant="outline"
                        onClick={() =>
                            setSelectedSection(Math.max(0, selectedSection - 1))
                        }
                        disabled={selectedSection === 0}
                    >
                        Previous Section
                    </Button>

                    <span className="text-legal-muted">
                        Section {selectedSection + 1} of {activeSections.length}
                    </span>

                    <Button
                        variant="legal"
                        onClick={() =>
                            setSelectedSection(
                                Math.min(
                                    activeSections.length - 1,
                                    selectedSection + 1
                                )
                            )
                        }
                        disabled={selectedSection === activeSections.length - 1}
                    >
                        Next Section
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default DocumentComparison;
