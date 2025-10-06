// src/components/Header.tsx
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import logo from "@/assets/legal-icon.png";

export default function Header() {
    return (
        <header className="absolute top-0 left-0 w-full p-4 sm:p-6 flex justify-between items-center z-50 bg-white backdrop-blur-sm shadow-sm">
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
                <Link to="/signup" className="text-xl font-medium text-blue-600">
                    <Button >Get Started</Button>
                </Link>
            </nav>
        </header>

    );

}
