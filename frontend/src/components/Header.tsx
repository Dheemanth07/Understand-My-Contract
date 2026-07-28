// src/components/Header.tsx
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import Logo from "./Logo";

export default function Header() {
    return (
        <header className="fixed top-0 left-0 w-full z-50 lp-floating-nav">
            {/* Left Side: Logo */}
            <Logo />

            {/* Right Side: Navigation Links */}
            <nav className="flex items-center space-x-2 sm:space-x-3">
                <Link
                    to="/signin"
                    className="hidden sm:inline-block text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors duration-200 no-underline px-3 py-1.5"
                >
                    Sign In
                </Link>
                <Link to="/signup" className="inline-flex">
                    <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-full transition-all duration-200 text-xs sm:text-sm shadow-sm"
                    >
                        Get Started
                    </Button>
                </Link>
            </nav>
        </header>
    );
}
