import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

type HistoryItem = {
    id: string;
    title: string;
    createdAt: string;
};

const HistoryList = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/history");
                if (!res.ok) throw new Error("Failed to load history");
                const data = await res.json();
                setHistory(data);
            } catch (err) {
                console.error("History fetch failed:", err);
            }
        })();
    }, []);

    return (
        <section className="py-12">
            <div className="max-w-5xl mx-auto px-6">
                <h2 className="text-2xl font-bold mb-6">📜 Past Documents</h2>
                {history.length === 0 ? (
                    <p className="text-legal-muted">No past documents yet.</p>
                ) : (
                    <div className="grid gap-4">
                        {history.map((doc) => (
                            <Card
                                key={doc.id}
                                className="p-4 flex items-center justify-between hover:shadow-lg transition"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-legal-primary" />
                                    <div>
                                        <h3 className="font-semibold">
                                            {doc.title}
                                        </h3>
                                        <p className="text-sm text-legal-muted">
                                            Processed on{" "}
                                            {new Date(
                                                doc.createdAt
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <Link to={`/history/${doc.id}`}>
                                    <Button variant="outline" size="sm">
                                        View
                                    </Button>
                                </Link>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default HistoryList;
