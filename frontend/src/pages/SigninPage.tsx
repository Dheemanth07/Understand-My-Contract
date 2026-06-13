// src/pages/SigninPage.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

import Logo from "@/components/Logo";
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

export default function SigninPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { signIn } = UserAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleSignin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await signIn(email, password);
            if (error) throw error;
            navigate("/dashboard");
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="p-8 w-full max-w-sm">
                <div className="flex justify-center mb-6">
                    <Logo />
                </div>
                <h1 className="text-2xl font-semibold text-center mb-2">
                    Log in to your account
                </h1>
                <p className="text-center text-sm text-gray-600 mb-6">
                    Don't have an account?{" "}
                    <Link
                        to="/signup"
                        className="font-medium text-indigo-600 hover:underline"
                    >
                        Sign Up
                    </Link>
                </p>

                {/* --- GOOGLE BUTTON ADDED HERE --- */}
                <GoogleSignInButton>Sign in with Google</GoogleSignInButton>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground">
                            Or with email and password
                        </span>
                    </div>
                </div>
                {/* --- END OF ADDED SECTION --- */}

                <form onSubmit={handleSignin}>
                    <div className="mb-4">
                        <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email Address</label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1"
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Signing In..." : "Sign In"}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
