// src/pages/Index.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import Header from "@/components/Header";
import LegalHero from "@/components/LegalHero";
import FeatureSection from "@/components/FeatureSection";
import Footer from "@/components/Footer";
import DocumentComparison from "@/components/DocumentComparison";
import ChatbotButton from "@/components/ChatBotButton";

const Index = () => {
    const { session } = UserAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (session) {
            navigate("/dashboard", { replace: true });
        }
    }, [session, navigate]);

    return (
        <div className="min-h-screen relative bg-white">
            <Header />
            <LegalHero />
            <FeatureSection />
            <DocumentComparison isDemo={true} />
            <ChatbotButton />
            <Footer />
        </div>
    );
};

export default Index;
