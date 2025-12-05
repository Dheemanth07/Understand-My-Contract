// src/pages/Index.tsx
import Header from "@/components/Header";
import LegalHero from "@/components/LegalHero";
import FeatureSection from "@/components/FeatureSection";
import Footer from "@/components/Footer";
import LandingPage from "./pages/LandingPage";

const Index = () => {
    return (
        <div className="min-h-screen relative">
            <Header />
            <LegalHero />
            <FeatureSection />
            <LandingPage />
            <Footer />
        </div>
    );
};

export default Index;
