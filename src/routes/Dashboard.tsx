// src/routes/Dashboard.tsx
import { useEffect, useState, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

// Import your feature and UI components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DocumentComparison from "@/components/DocumentComparison";
import Logo from "@/components/Logo";

// This should be in your .env file
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// --- Define the data structures for your results ---
interface SectionResult {
    section: number;
    original: string;
    summary: string;
    legalTerms: { term: string; definition: string }[];
}

interface HistoryItem {
    id: string;
    filename: string;
    createdAt: string;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { session, signOut } = UserAuth();

    // --- State for all dashboard features ---
    const [file, setFile] = useState<File | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [analysisResults, setAnalysisResults] = useState<SectionResult[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    // Fetch history when the component mounts
    useEffect(() => {
        if (session) {
            fetchHistory();
        }
    }, [session]);

    const fetchHistory = async () => {
        if (!session?.access_token) return;
        try {
            setLoadingHistory(true);
            const resp = await axios.get(`${BACKEND_URL}/history`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            setHistory(resp.data);
        } catch (err) {
            console.error("Failed to fetch history:", err);
            toast({
                title: "Error",
                description: "Could not fetch document history.",
                variant: "destructive",
            });
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleUpload = async () => {
        if (!file || !session?.access_token) {
            toast({
                title: "Error",
                description:
                    "Please select a file and ensure you are logged in.",
                variant: "destructive",
            });
            return;
        }
        try {
            setUploading(true);
            setAnalysisResults([]);
            setIsComplete(false);
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(`${BACKEND_URL}/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${session.access_token}` },
                body: formData,
            });
            if (!response.ok || !response.body) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const messages = buffer.split("\n\n");
                buffer = messages.pop() || "";
                for (const message of messages) {
                    if (message.startsWith("data: ")) {
                        const jsonString = message.substring(6);
                        if (jsonString) {
                            const data = JSON.parse(jsonString);
                            if (data.done) {
                                setIsComplete(true);
                                fetchHistory();
                                return;
                            }
                            if (data.error) throw new Error(data.error);
                            if (data.section) {
                                setAnalysisResults((prev) => [...prev, data]);
                            }
                        }
                    }
                }
            }
        } catch (err: any) {
            console.error("Upload failed:", err);
            toast({
                title: "Upload Failed",
                description: err.message || "An error occurred.",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (idToDelete: string, event: MouseEvent) => {
        event.stopPropagation();
        if (!session?.access_token) return;
        if (
            !window.confirm(
                "Are you sure you want to permanently delete this item?"
            )
        ) {
            return;
        }
        try {
            await axios.delete(`${BACKEND_URL}/history/${idToDelete}`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            setHistory((prevHistory) =>
                prevHistory.filter((item) => item.id !== idToDelete)
            );
            toast({ title: "Success", description: "History item deleted." });
        } catch (err) {
            console.error("Failed to delete history item:", err);
            toast({
                title: "Error",
                description: "Could not delete the item.",
                variant: "destructive",
            });
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate("/");
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to sign out.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <aside className="w-1/4 bg-white shadow-md p-6 flex flex-col justify-between border-r">
                <div>
                    <div className="mb-8">
                        <Logo />
                    </div>
                    <h2 className="text-2xl font-bold text-indigo-700 mb-2">
                        Hello, {session?.user?.email?.split("@")[0]} 👋
                    </h2>
                    <p className="text-gray-500 text-sm mb-8">
                        Welcome to your Dashboard
                    </p>
                    <h3 className="text-lg font-semibold mb-3">
                        📜 Your History
                    </h3>
                    {loadingHistory ? (
                        <p>Loading...</p>
                    ) : history.length > 0 ? (
                        <ul className="space-y-2 overflow-y-auto max-h-[400px]">
                            {history.map((item) => (
                                <li
                                    key={item.id}
                                    data-testid={`history-item-${item.id}`}
                                    className="p-3 border rounded-md hover:bg-indigo-50 cursor-pointer flex justify-between items-center"
                                    onClick={() =>
                                        navigate(`/history/${item.id}`)
                                    }
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                            {item.filename}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(
                                                item.createdAt
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                    <Button
                                        data-testid={`delete-history-${item.id}`}
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:bg-red-100 hover:text-red-600 ml-2"
                                        onClick={(e) =>
                                            handleDelete(item.id, e)
                                        }
                                    >
                                        Delete
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No history yet.</p>
                    )}
                </div>
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSignOut}
                >
                    Logout
                </Button>
            </aside>

            <main className="flex-1 p-10 overflow-y-auto">
                <Card className="p-8 shadow-lg bg-white mb-8">
                    <h1 className="text-3xl font-bold text-indigo-700 mb-6">
                        Upload Your Legal Document
                    </h1>
                    <div className="mb-6">
                        <Label>Select a file (.pdf, .docx, .txt)</Label>
                        <Input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={(e) =>
                                setFile(e.target.files?.[0] || null)
                            }
                            className="mt-2"
                        />
                    </div>
                    <Button
                        data-testid="upload-button"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={handleUpload}
                        disabled={uploading}
                    >
                        {uploading ? "Processing..." : "Upload & Simplify"}
                    <Button
                        data-testid="logout-button"
                        variant="outline"
                        className="w-full"
                        onClick={handleSignOut}
                    >
                        Logout
                    </Button>
                            Analysis Results
                        </h2>
                        <div className="space-y-6">
                            {analysisResults.map((result, index) => (
                                <Card
                                    key={index}
                                    className="p-6 bg-white shadow-lg"
                                >
                                    <h3 className="text-lg font-semibold text-indigo-700 mb-2">
                                        Section {result.section}
                                    </h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">
                                        {result.summary}
                                    </p>
                                    {result.legalTerms &&
                                        result.legalTerms.length > 0 && (
                                            <div className="mt-4 pt-4 border-t">
                                                <h4 className="font-semibold text-gray-600">
                                                    Key Terms:
                                                </h4>
                                                <ul className="list-disc list-inside mt-2 text-sm text-gray-600">
                                                    {result.legalTerms.map(
                                                        (term, termIndex) => (
                                                            <li key={termIndex}>
                                                                <strong>
                                                                    {term.term}:
                                                                </strong>{" "}
                                                                {
                                                                    term.definition
                                                                }
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
