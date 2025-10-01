// src/pages/AuthPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
    });

    // ✅ Automatically redirect when user logs in (manual or Google)
    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();

            setTimeout(() => {
                if (data?.session?.user) navigate("/dashboard");
            }, 500);
        };

        checkSession();

        const { data: listener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (session?.user) navigate("/dashboard");
            }
        );

        return () => {
            listener.subscription.unsubscribe();
        };
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAuth = async () => {
        setLoading(true);
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                });
                if (error) throw error;
                toast({ title: "Login successful" });
                navigate("/dashboard");
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            first_name: formData.first_name,
                            last_name: formData.last_name,
                        },
                    },
                });
                if (error) throw error;

                // ✅ Create profile entry in Supabase
                if (data.user) {
                    const { error: insertError } = await supabase.from("profiles").insert({
                        user_id: data.user.id, // ✅ matches your table schema
                        email: formData.email,
                        username: formData.first_name + " " + formData.last_name,
                    });
                    if (insertError) console.error("Profile insert failed:", insertError);
                }

                toast({
                    title: "Signup successful!", 
                    descripttion:"Please check your email to verify.",
                });
            }
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

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo:
                    "https://automatic-space-tribble-7vxrx9q7v5xhr55j-8080.app.github.dev/", // ✅ redirect back to your frontend
            },
        });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200">
            <Card className="p-10 w-full max-w-md bg-white shadow-xl">
                <h1 className="text-3xl font-bold text-center mb-6">
                    {isLogin ? "Login" : "Create Account"}
                </h1>

                {!isLogin && (
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                            <Label>First Name</Label>
                            <Input
                                name="first_name"
                                onChange={handleChange}
                                value={formData.first_name}
                            />
                        </div>
                        <div className="flex-1">
                            <Label>Last Name</Label>
                            <Input
                                name="last_name"
                                onChange={handleChange}
                                value={formData.last_name}
                            />
                        </div>
                    </div>
                )}

                <div className="mb-4">
                    <Label>Email</Label>
                    <Input
                        type="email"
                        name="email"
                        onChange={handleChange}
                        value={formData.email}
                    />
                </div>

                <div className="mb-6">
                    <Label>Password</Label>
                    <Input
                        type="password"
                        name="password"
                        onChange={handleChange}
                        value={formData.password}
                    />
                </div>

                <Button
                    className="w-full mb-4"
                    onClick={handleAuth}
                    disabled={loading}
                >
                    {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
                </Button>

                <Button
                    variant="outline"
                    className="w-full mb-4"
                    onClick={signInWithGoogle}
                >
                    Sign in with Google
                </Button>

                <p className="text-center text-sm">
                    {isLogin
                        ? "Don’t have an account?"
                        : "Already have an account?"}{" "}
                    <span
                        className="text-blue-600 cursor-pointer hover:underline"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? "Sign up" : "Login"}
                    </span>
                </p>
            </Card>
        </div>
    );
}
