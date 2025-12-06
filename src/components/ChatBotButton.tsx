import { MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChatbotButton() {
    // 👇 REPLACE THIS with the actual link to your chatbot
    const CHATBOT_URL = "https://your-chatbot-link.com";

    return (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2 group">
            {/* Tooltip Label (Appears on Hover) */}
            <span className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute right-16 whitespace-nowrap pointer-events-none">
                Legal Rights Chatbot
            </span>

            {/* The Button */}
            <a href={CHATBOT_URL} target="_blank" rel="noopener noreferrer">
                <Button
                    size="icon"
                    className="h-16 w-16 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-xl border-4 border-white transition-transform hover:scale-110"
                >
                    <MessageCircleQuestion className="h-8 w-8 text-white" />
                </Button>
            </a>
        </div>
    );
}
