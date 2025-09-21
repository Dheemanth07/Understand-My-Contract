import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    // This check helps during development to ensure env variables are set.
    // In a real build, this might not be reachable if variables are missing.
    console.error(
        "Supabase URL and Anon Key are missing from environment variables."
    );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface SectionResult {
    section: number;
    originalText: string;
    simplifiedText: string;
    legalTerms: { term: string; definition: string }[];
}

interface Glossary {
    [key: string]: string;
}

interface UploadSectionProps {
    onProcessComplete: (results: SectionResult[], glossary: Glossary) => void;
}

const UploadSection = ({ onProcessComplete }: UploadSectionProps) => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    // State to store results from the backend
    const [results, setResults] = useState<SectionResult[]>([]);
    const [glossary, setGlossary] = useState<Glossary>({});
    const [totalSections, setTotalSections] = useState(0);

    const ALLOWED_FILE_TYPES = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    ];

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleFile = (selectedFile: File) => {
        if (ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
            setFile(selectedFile);
            setResults([]); // Clear previous results
            setGlossary({});
            toast({
                title: "File ready",
                description: `${selectedFile.name} is ready for processing.`,
            });
        } else {
            toast({
                title: "Invalid file type",
                description: "Please upload a PDF, DOCX, or TXT file.",
                variant: "destructive",
            });
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFile(e.target.files[0]);
    };

    const removeFile = () => {
        setFile(null);
        setResults([]);
        setGlossary({});
        setTotalSections(0);
    };

    const processDocument = async () => {
        if (!file) return;

        setIsProcessing(true);
        setResults([]);
        setGlossary({});
        setTotalSections(0);

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session)
                throw new Error("You must be logged in to process documents.");

            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(
                "http://localhost:5000/upload?lang=en",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: formData,
                }
            );

            if (!response.ok || !response.body) {
                const errorData = await response
                    .json()
                    .catch(() => ({ error: "An unknown error occurred." }));
                throw new Error(errorData.error);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let finalResults: SectionResult[] = [];
            let finalGlossary: Glossary = {};

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data.done) break;
                            if (data.glossary) {
                                setGlossary(data.glossary);
                                finalGlossary = data.glossary;
                            }
                            if (data.totalSections)
                                setTotalSections(data.totalSections);
                            if (data.section) {
                                setResults((prev) => [...prev, data]);
                                finalResults.push(data);
                            }
                            if (data.error) throw new Error(data.error);
                        } catch (e) {
                            console.error(
                                "Failed to parse SSE JSON chunk: ",
                                line.substring(6)
                            );
                        }
                    }
                }
            }
            onProcessComplete(finalResults, finalGlossary); // Pass final data up
            toast({
                title: "Processing complete!",
                description: "Your document has been successfully simplified.",
            });
        } catch (err: any) {
            toast({
                title: "An error occurred",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const viewResults = () => {
        // Scroll to the DocumentComparison section
        const comparisonSection = document.querySelector(
            "#document-comparison"
        );
        if (comparisonSection) {
            comparisonSection.scrollIntoView({ behavior: "smooth" });
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <section className="py-20 bg-gradient-accent">
            <div className="max-w-4xl mx-auto px-6">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-legal-dark mb-4">
                        Upload Your{" "}
                        <span className="text-legal-primary">
                            Legal Document
                        </span>
                    </h2>
                    <p className="text-xl text-legal-muted max-w-2xl mx-auto">
                        Get started by uploading your PDF contract or legal
                        document. Our AI will analyze and simplify it in
                        seconds.
                    </p>
                </div>

                <Card className="p-8 bg-white shadow-medium border-0">
                    {/* Upload Area */}
                    <div
                        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                            dragActive
                                ? "border-legal-primary bg-legal-primary/5 scale-105"
                                : "border-gray-300 hover:border-legal-primary hover:bg-legal-primary/5"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            multiple
                            accept=".pdf"
                            onChange={handleFileSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />

                        <div className="space-y-4">
                            <div className="w-16 h-16 mx-auto bg-legal-primary/10 rounded-full flex items-center justify-center">
                                <Upload className="w-8 h-8 text-legal-primary" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-legal-dark">
                                    {dragActive
                                        ? "Drop your file here"
                                        : "Drag & drop your PDF file"}
                                </h3>
                                <p className="text-legal-muted">
                                    or{" "}
                                    <span className="text-legal-primary font-medium cursor-pointer hover:underline">
                                        browse to choose file
                                    </span>
                                </p>
                                <p className="text-sm text-legal-muted">
                                    Supports PDF file up to 10MB each
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* File List */}
                    {file.length > 0 && (
                        <div className="mt-8 space-y-4">
                            <h4 className="text-lg font-semibold text-legal-dark">
                                Selected Files
                            </h4>

                            <div className="space-y-3">
                                {file.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-8 h-8 text-legal-primary" />
                                            <div>
                                                <p className="font-medium text-legal-dark">
                                                    {file.name}
                                                </p>
                                                <p className="text-sm text-legal-muted">
                                                    {formatFileSize(file.size)}
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFile(index)}
                                            className="text-gray-500 hover:text-red-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Processing Progress */}
                    {isProcessing && (
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-semibold text-legal-dark">
                                    Processing Documents...
                                </span>
                                <span className="text-legal-primary font-medium">
                                    {uploadProgress}%
                                </span>
                            </div>
                            <Progress value={uploadProgress} className="h-3" />
                            <p className="text-sm text-legal-muted">
                                Analyzing legal terms and generating simplified
                                version...
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            variant="legal"
                            size="lg"
                            onClick={processDocuments}
                            disabled={file.length === 0 || isProcessing}
                            className="px-8"
                        >
                            {isProcessing ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <FileText className="w-5 h-5" />
                                    Process{" "}
                                    {file.length > 0
                                        ? `${file.length} Document${
                                              file.length > 1 ? "s" : ""
                                          }`
                                        : "Documents"}
                                </>
                            )}
                        </Button>

                        {uploadProgress === 100 && (
                            <Button
                                variant="accent"
                                size="lg"
                                className="px-8"
                                onClick={viewResults}
                            >
                                <CheckCircle className="w-5 h-5" />
                                View Results
                            </Button>
                        )}
                    </div>

                    {/* Security Notice */}
                    <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-green-800">
                                    Your documents are secure
                                </p>
                                <p className="text-green-700">
                                    Your documents are stored securely in our
                                    database and never shared with third
                                    parties. We guarantee confidentiality
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </section>
    );
};

export default UploadSection;
