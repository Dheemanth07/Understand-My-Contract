import { useState } from "react";
import LegalHero from "@/components/LegalHero";
import FeatureSection from "@/components/FeatureSection";
import UploadSection from "@/components/UploadSection";
import DocumentComparison from "@/components/DocumentComparison";
import Footer from "@/components/Footer";

// Define the data structures for the results that will be passed between components
interface SectionResult {
    section: number;
    original: string;
    summary: string;
    legalTerms: { term: string; definition: string }[];
}

interface Glossary {
    [key: string]: string;
}

const Index = () => {
    // State to hold the analysis results. This is the "brain" of the page.
    const [analysisResults, setAnalysisResults] = useState<SectionResult[]>([]);
    const [glossary, setGlossary] = useState<Glossary>({});
    const [isComplete, setIsComplete] = useState(false);

    // This is the callback function that <UploadSection> will call when processing is finished.
    const handleProcessingComplete = (
        results: SectionResult[],
        newGlossary: Glossary
    ) => {
        setAnalysisResults(results);
        setGlossary(newGlossary);
        setIsComplete(true); // This tells the page to now show the results section.
    };

    return (
        <div className="min-h-screen">
            <LegalHero />
            <FeatureSection />

            {/* We pass the callback function as a prop to UploadSection */}
            <UploadSection onProcessComplete={handleProcessingComplete} />

            {/* This is the key change: The DocumentComparison component will ONLY be displayed 
              AFTER the processing is complete and we have results to show.
            */}
            {isComplete && analysisResults.length > 0 && (
                <DocumentComparison
                    results={analysisResults}
                    glossary={glossary}
                />
            )}

            <Footer />
        </div>
    );
};

export default Index;
