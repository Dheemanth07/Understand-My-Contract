// src/components/Header.tsx
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import logo from "@/assets/legal-icon.png";

export default function Header() {
    return (
        <header class="fixed top-0 left-0 w-full h-20 bg-white shadow-md z-50 flex items-center justify-between px-6">
            {/* Left Side: Your App Name or Logo */}
            <Link to="/" className="flex items-center space-x-3">
                {/* ⚖️ Logo icon */}
                <div className="bg-blue-600 rounded-md">
                    <img
                        src={logo}
                        alt="LegalSimplify Logo"
                        className="w-14 h-14 rounded-full object-contain"
                    />
                </div>
                <span className="text-3xl font-bold text-blue-600">
                    LegalSimplify
                </span>
            </Link>

            {/* Right Side: Navigation Links */}
            <nav className="flex items-center space-x-4 sm:space-x-6">
                <Link
                    to="/signin"
                    className="text-xl font-medium text-blue-600 hover:text-gray-900 transition-colors"
                >
                    Sign In
                </Link>
                <Link
                    to="/signup"
                    className="text-xl font-medium text-blue-600"
                >
                    <Button>Get Started</Button>
                </Link>
            </nav>
        </header>
    );
}
