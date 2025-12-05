import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import DocumentComparison from "@/components/DocumentComparison";

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* --- 1. Navbar --- */}
            <header className="fixed top-0 left-0 w-full h-20 bg-white/80 backdrop-blur-md shadow-sm z-50 flex items-center justify-between px-6 border-b">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-indigo-600">
                        LegalSimplify
                    </span>
                </div>
                <div className="flex gap-4">
                    <Link to="/signin">
                        <Button variant="ghost">Sign In</Button>
                    </Link>
                    <Link to="/signup">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            Get Started
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="pt-20">
                {/* --- 2. Hero Section --- */}
                <section className="py-20 px-6 text-center bg-gradient-to-b from-blue-50 to-white">
                    <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                        Understand Contracts in <br />
                        <span className="text-indigo-600">Plain English</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                        Stop pretending you read the Terms & Conditions. Our AI
                        translates legal jargon into simple summaries instantly.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link to="/signup">
                            <Button
                                size="lg"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-8"
                            >
                                Try for Free
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* --- 3. The Demo Component (Mock Data) --- */}
                <div className="bg-gray-50/50 border-t">
                    <DocumentComparison isDemo={true} />
                </div>
            </main>

            {/* --- 4. Footer --- */}
            <footer className="py-8 bg-white text-center text-gray-500 text-sm border-t mt-auto">
                <p>© 2025 LegalSimplify. All rights reserved.</p>
            </footer>
        </div>
    );
}
