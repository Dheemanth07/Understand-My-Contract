// src/pages/HistoryView.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HistoryView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [document, setDocument] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            // Check authentication
            const { data } = await supabase.auth.getUser();
            if (!data.user) {
                navigate("/");
                return;
            }
            setUser(data.user);

            try {
                const token = (await supabase.auth.getSession()).data.session
                    ?.access_token;
                const response = await fetch(
                    `http://localhost:5000/history/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) throw new Error("Failed to fetch document");
                const dataJson = await response.json();
                setDocument(dataJson);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading)
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500 text-lg animate-pulse">
                    Loading document...
                </p>
            </div>
        );

    if (!document)
        return (
            <div className="p-10 text-center text-red-500">
                Document not found or you don’t have access.
            </div>
        );

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    {document.filename || "Document Summary"}
                </h1>
                <Button variant="outline" onClick={() => navigate(-1)}>
                    Back
                </Button>
            </header>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-2 text-gray-700">
                    Details
                </h2>
                <p>
                    <strong>Uploaded by:</strong> {user?.email}
                </p>
                <p>
                    <strong>Input Language:</strong> {document.inputLang}
                </p>
                <p>
                    <strong>Output Language:</strong> {document.outputLang}
                </p>
                <p>
                    <strong>Created:</strong>{" "}
                    {new Date(document.createdAt).toLocaleString()}
                </p>
            </section>

            <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                    Simplified Sections
                </h2>
                <div className="space-y-6">
                    {document.sections.map((section: any, idx: number) => (
                        <Card key={idx} className="p-6 bg-white shadow-md">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                Section {idx + 1}
                            </h3>
                            <div className="mb-3">
                                <p className="text-sm font-semibold text-gray-600">
                                    Original Text:
                                </p>
                                <p className="text-gray-700 whitespace-pre-line mt-1">
                                    {section.original}
                                </p>
                            </div>
                            <div className="mb-3">
                                <p className="text-sm font-semibold text-gray-600">
                                    Simplified Summary:
                                </p>
                                <p className="text-gray-800 whitespace-pre-line mt-1">
                                    {section.summary}
                                </p>
                            </div>

                            {section.legalTerms?.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-sm font-semibold text-gray-600 mb-2">
                                        Legal Terms:
                                    </p>
                                    <ul className="list-disc pl-6 text-gray-700">
                                        {section.legalTerms.map(
                                            (termObj: any, i: number) => (
                                                <li key={i}>
                                                    <strong>
                                                        {termObj.term}
                                                    </strong>
                                                    : {termObj.definition}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                    Glossary
                </h2>
                <Card className="p-6 bg-white shadow-md">
                    {Object.keys(document.glossary || {}).length > 0 ? (
                        <ul className="list-disc pl-6 text-gray-700">
                            {Object.entries(document.glossary).map(
                                ([term, definition]: any, i) => (
                                    <li key={i}>
                                        <strong>{term}</strong>: {definition}
                                    </li>
                                )
                            )}
                        </ul>
                    ) : (
                        <p className="text-gray-500">
                            No glossary terms available.
                        </p>
                    )}
                </Card>
            </section>
        </div>
    );
}
