import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const UploadSection = () => {
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);

            const droppedFiles = Array.from(e.dataTransfer.files);
            const pdfFiles = droppedFiles.filter(
                (file) => file.type === "application/pdf"
            );

            if (pdfFiles.length > 0) {
                setFiles(pdfFiles);
                // Use setTimeout to avoid calling toast during render
                setTimeout(() => {
                    toast({
                        title: "Files uploaded successfully",
                        description: `${pdfFiles.length} PDF file(s) ready for processing.`,
                    });
                }, 0);
            } else {
                setTimeout(() => {
                    toast({
                        title: "Invalid file type",
                        description: "Please upload PDF files only.",
                        variant: "destructive",
                    });
                }, 0);
            }
        },
        [toast]
    );

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const pdfFiles = selectedFiles.filter(
            (file) => file.type === "application/pdf"
        );

        if (pdfFiles.length > 0) {
            setFiles(pdfFiles);
            setTimeout(() => {
                toast({
                    title: "Files selected successfully",
                    description: `${pdfFiles.length} PDF file(s) ready for processing.`,
                });
            }, 0);
        }
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const extractTextFromPDF = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items
                .map((item: any) => item.str)
                .join(" ");
            text += pageText + "\n";
        }

        return text;
    };

    async function simplifyTextWithSupabase(text: string): Promise<string> {
        const response = await fetch(
            `{import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/simplify-doc`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({ text }),
            }
        );

        if(!response.ok){
            throw new Error(`Functin error: ${response.statusText}`);
        }

        const {simplified} = await response.json();
        return simplified;
    }

    const processDocuments = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        setUploadProgress(0);

        try {
            for (const file of files) {
                //1. Upload to Supabase storage
                const { data: storageData, error: storageError } =
                    await supabase.storage
                        .from("documents") // bucket name in Supabase
                        .upload(`docs/${file.name}`, file, {
                            upsert: true, // overwrite if same name exists
                        });

                if (storageError) {
                    console.error("Upload failed:", storageError.message);
                    toast({
                        title: "Upload error",
                        description: storageError.message,
                        variant: "destructive",
                    });
                    continue; // skip to next file
                }
                // 2. Extract text from PDF (placeholder - implement actual extraction)
                const extractedText = await extractTextFromPDF(file);
                console.log("Extracted Text:", extractedText);

                // 3. Simplify with OpenAI (placeholder)
                const simplifiedText = await simplifyTextWithSupabase(extractedText);
                console.log("Simplified Text:", simplifiedText);

                // 4. Store results in Supabase
                const { error: dbError } = await supabase
                    .from("documents_analysis")
                    .insert({
                        file_name: file.name,
                        original_text: extractedText,
                        simplified_text: simplifiedText,
                    });

                if (dbError) {
                    console.error("DB insert failed:", dbError.message);
                    toast({
                        title: "Database error",
                        description: dbError.message,
                        variant: "destructive",
                    });
                }
            }

            setUploadProgress(100);
            setIsProcessing(false);
            toast({
                title: "Processing complete!",
                description: "Your documents have been uploaded successfully.",
            });
        } catch (err: any) {
            console.error("Unexpected error:", err);
            toast({
                title: "Unexpected error",
                description: err.message || "Something went wrong",
                variant: "destructive",
            });
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
                                        ? "Drop your files here"
                                        : "Drag & drop your PDF files"}
                                </h3>
                                <p className="text-legal-muted">
                                    or{" "}
                                    <span className="text-legal-primary font-medium cursor-pointer hover:underline">
                                        browse to choose files
                                    </span>
                                </p>
                                <p className="text-sm text-legal-muted">
                                    Supports PDF files up to 10MB each
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="mt-8 space-y-4">
                            <h4 className="text-lg font-semibold text-legal-dark">
                                Selected Files
                            </h4>

                            <div className="space-y-3">
                                {files.map((file, index) => (
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
                            disabled={files.length === 0 || isProcessing}
                            className="px-8"
                        >
                            {isProcessing ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <FileText className="w-5 h-5" />
                                    Process{" "}
                                    {files.length > 0
                                        ? `${files.length} Document${
                                              files.length > 1 ? "s" : ""
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
                                    Files are processed locally and never stored
                                    on our servers. Complete privacy and
                                    confidentiality guaranteed.
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
