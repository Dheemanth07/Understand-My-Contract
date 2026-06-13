import { Button } from "@/components/ui/button";
import { Upload, FileText, Zap } from "lucide-react";
import heroImage from "@/assets/hero-legal.jpg";

const LegalHero = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero text-white overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src={heroImage}
                    alt="Legal document analysis visualization"
                    className="w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-hero opacity-90" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
                <div className="space-y-8">
                    {/* Main Heading */}
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                            Simplify{" "}
                            <span className="text-white font-extrabold">
                                Legal
                            </span>{" "}
                            Documents
                        </h1>
                        <p className="text-xl md:text-2xl text-legal-light/90 max-w-3xl mx-auto leading-relaxed">
                            Transform complex legal jargon into plain English.
                            Upload any contract or agreement and get an
                            easy-to-understand, side-by-side comparison
                            instantly.
                        </p>
                    </div>

                    {/* Feature Pills */}
                    <div className="flex flex-wrap justify-center gap-4 mb-8">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                            <Upload className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                PDF Upload
                            </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                Side-by-Side
                            </span>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            variant="hero"
                            size="lg"
                            className="text-lg px-8 py-4"
                        >
                            <Upload className="w-5 h-5" />
                            Upload Document Now
                        </Button>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
                    <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse" />
                </div>
            </div>
        </section>
    );
};

export default LegalHero;
