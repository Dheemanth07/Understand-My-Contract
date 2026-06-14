// src/components/Header.tsx
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import Logo from "./Logo";

export default function Header() {
    return (
        <header className="fixed top-0 left-0 w-full h-16 bg-white border-b border-slate-200/80 z-50 flex items-center justify-between transition-all duration-200">
            <div className="max-w-7xl mx-auto w-full h-full flex items-center justify-between px-6">
                {/* Left Side: Logo */}
                <Logo />

                {/* Right Side: Navigation Links */}
                <nav className="flex items-center space-x-6">
                    <Link
                        to="/signin"
                        className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors duration-200"
                    >
                        Sign In
                    </Link>
                    <Link
                        to="/signup"
                        className="inline-flex"
                    >
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 transition-all duration-200 rounded-md">
                            Get Started
                        </Button>
                    </Link>
                </nav>
            </div>
        </header>
    );
}
