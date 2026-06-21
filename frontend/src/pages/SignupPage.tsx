// src/pages/SignupPage.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import Logo from "@/components/Logo";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function SignupPage() {
    const { session } = UserAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (session) {
            navigate("/dashboard", { replace: true });
        }
    }, [session, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: `${formData.firstName} ${formData.lastName}`, 
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                    },
                },
            });

            if (error) throw error;

            if (data.user && !data.session) {
                if (data.user.identities && data.user.identities.length === 0) {
                    toast({
                        title: "Error",
                        description: "User already exists",
                        variant: "destructive",
                    });
                    return;
                }
                toast({
                    title: "Signup successful!",
                    description: "Your account has been created successfully. Please sign in.",
                });
                navigate("/signin");
                return;
            }

            toast({
                title: "Signup successful!",
                description: "You are now logged in.",
            });

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
                <p className="text-center text-xs text-slate-500 mb-4">
                    Already have an account?{" "}
                    <Link
                        to="/signin"
                        className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                        Click here to sign in →
                    </Link>
                </p>
                <h1 className="text-xl font-bold text-center text-slate-900 mb-6">Sign up</h1>

                <GoogleSignInButton>Sign up with Google</GoogleSignInButton>

                <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
                        <span className="bg-white px-2.5 text-slate-400">
                            Or continue with
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-1">
                            <label htmlFor="firstName" className="text-xs font-semibold text-slate-700">First Name*</label>
                            <Input
                                id="firstName"
                                name="firstName"
                                onChange={handleChange}
                                required
                                className="bg-white border-slate-250 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 rounded-md h-10 mt-1"
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <label htmlFor="lastName" className="text-xs font-semibold text-slate-700">Last Name*</label>
                            <Input
                                id="lastName"
                                name="lastName"
                                onChange={handleChange}
                                required
                                className="bg-white border-slate-250 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 rounded-md h-10 mt-1"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="email" className="text-xs font-semibold text-slate-700">Email*</label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            onChange={handleChange}
                            required
                            className="bg-white border-slate-250 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 rounded-md h-10 mt-1"
                        />
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="password" className="text-xs font-semibold text-slate-700">Password*</label>
                        <Input
                            id="password"
                            type="password"
                            name="password"
                            onChange={handleChange}
                            required
                            className="bg-white border-slate-250 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 rounded-md h-10 mt-1"
                        />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all h-10 mt-2 rounded-md shadow-sm" disabled={loading}>
                        {loading ? "Creating Account..." : "Create your account"}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
