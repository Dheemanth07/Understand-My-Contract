// src/pages/Index.tsx
import Header from "@/components/Header";
import LegalHero from "@/components/LegalHero";
import FeatureSection from "@/components/FeatureSection";
import Footer from "@/components/Footer";

const Index = () => {
    return (
        <div className="min-h-screen relative">
            <Header />

            {/* Your public-facing marketing components */}
            <LegalHero />
            <FeatureSection />
            <Footer />
        </div>
    );
};

export default Index;
