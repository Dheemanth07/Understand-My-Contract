// src/pages/SigninPage.tsx
import { useState, useEffect } from "react";
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
    const { signIn, session } = UserAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        if (session) {
            navigate("/dashboard", { replace: true });
        }
    }, [session, navigate]);

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
        <div className="flex items-center justify-center min-h-screen bg-slate-50 px-6 py-12">
            <Card className="bg-white border border-slate-200/80 shadow-sm p-8 w-full max-w-sm rounded-lg">
                <div className="flex justify-center mb-6">
                    <Logo />
                </div>
                <h1 className="text-xl font-bold text-center text-slate-900 mb-2">
                    Log in to your account
                </h1>
                <p className="text-center text-xs text-slate-500 mb-6">
                    Don't have an account?{" "}
                    <Link
                        to="/signup"
                        className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                        Sign Up
                    </Link>
                </p>

                <GoogleSignInButton>Sign in with Google</GoogleSignInButton>

                <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
                        <span className="bg-white px-2.5 text-slate-400">
                            Or with email and password
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSignin} className="space-y-4">
                    <div className="space-y-1">
                        <label htmlFor="email" className="text-xs font-semibold text-slate-700">Email Address</label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-white border-slate-250 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 rounded-md h-10 mt-1"
                        />
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-white border-slate-250 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 rounded-md h-10 mt-1"
                        />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all h-10 mt-2 rounded-md shadow-sm" disabled={loading}>
                        {loading ? "Signing In..." : "Sign In"}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
