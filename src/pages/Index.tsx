// src/pages/Index.tsx
import Header from "@/components/Header";
import LegalHero from "@/components/LegalHero";
import FeatureSection from "@/components/FeatureSection";
import Footer from "@/components/Footer";
import DocumentComparison from "@/components/DocumentComparison";

const Index = () => {
    return (
        <div className="min-h-screen relative">
            <Header />
            <LegalHero />
            <FeatureSection />
            <div className="bg-gray-50/50 border-t border-b">
                <DocumentComparison isDemo={true} />
            </div>
            <Footer />
        </div>
    );
};

export default Index;
