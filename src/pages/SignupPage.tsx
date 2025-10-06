// src/pages/SignupPage.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import Logo from "@/components/Logo";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function SignupPage() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

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
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                    },
                },
            });
            if (error) throw error;
            if (data.user && !data.session) {
                toast({
                    title: "User already exists",
                    description:
                        "An account with this email is already registered. Please sign in instead.",
                    variant: "destructive",
                });
                return;
            }
            toast({
                title: "Signup successful!",
                description: "Please check your email to verify your account.",
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

    // ✅ ADD THIS FUNCTION BACK IN
    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.origin },
        });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="p-8 w-full max-w-sm">
                <div className="flex justify-center mb-6">
                    <Logo />
                </div>
                <p className="text-center text-sm text-gray-600 mb-4">
                    Already have an account?{" "}
                    <Link
                        to="/signin"
                        className="font-medium text-indigo-600 hover:underline"
                    >
                        Click here to sign in →
                    </Link>
                </p>
                <h1 className="text-2xl font-bold text-center mb-6">Sign up</h1>

                {/* This button component now calls the function we just added */}
                <GoogleSignInButton>Sign up with Google</GoogleSignInButton>

                {/* ✅ ADD THIS DIVIDER BACK IN */}
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSignup}>
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                            <Label>First Name*</Label>
                            <Input
                                name="firstName"
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <Label>Last Name*</Label>
                            <Input
                                name="lastName"
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <Label>Email*</Label>
                        <Input
                            type="email"
                            name="email"
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <Label>Password*</Label>
                        <Input
                            type="password"
                            name="password"
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading
                            ? "Creating Account..."
                            : "Create your account"}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
