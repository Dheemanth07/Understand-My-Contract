// src/components/ChatBotButton.tsx
import { MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChatbotButton() {
    const CHATBOT_URL = "https://legal-rights-awareness-chatbot.vercel.app";

    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 group">
            {/* Tooltip Label (Appears on Hover) */}
            <span className="bg-slate-850 bg-slate-800 border border-slate-700 text-slate-100 px-3 py-1.5 rounded-lg shadow-md text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute right-14 whitespace-nowrap pointer-events-none">
                Legal Rights Awareness Chatbot
            </span>

            {/* The Button */}
            <a
                href={CHATBOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open legal rights chatbot"
            >
                <Button
                    size="icon"
                    className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-200 hover:scale-105 border-0"
                >
                    <MessageCircleQuestion className="h-5 w-5 text-white" />
                </Button>
            </a>
        </div>
    );
}
