import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMarkdownToHtml(text: string): string {
    if (!text) return "";
    
    // 1. Escape HTML to prevent XSS
    let html = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
        
    // 2. Convert bold: **text** -> styled strong
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>');

    // 3. Process lines
    const lines = html.split("\n");
    let inList = false;
    let listType: "ul" | "ol" | null = null;
    const processedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const line = raw.trim();
        
        // Match bullet points: single * (not **), - or •
        const bulletMatch = line.match(/^(?:\*(?!\*)|\-|\u2022)\s+(.*)/);
        // Match numbered points starting with number + dot/parenthesis
        const numberMatch = line.match(/^(\d+)[\.\)]\s+(.*)/);
        
        if (bulletMatch) {
            if (!inList || listType !== "ul") {
                if (inList) processedLines.push(listType === "ol" ? "</ol>" : "</ul>");
                processedLines.push('<ul class="list-disc pl-4 mt-3 mb-3 space-y-2 text-slate-700">');
                inList = true;
                listType = "ul";
            }
            processedLines.push(`<li class="leading-relaxed">${bulletMatch[1]}</li>`);
        } else if (numberMatch) {
            if (!inList || listType !== "ol") {
                if (inList) processedLines.push(listType === "ol" ? "</ol>" : "</ul>");
                processedLines.push('<ol class="list-decimal pl-4 mt-3 mb-3 space-y-2 text-slate-700">');
                inList = true;
                listType = "ol";
            }
            processedLines.push(`<li class="leading-relaxed">${numberMatch[2]}</li>`);
        } else {
            if (inList) {
                processedLines.push(listType === "ol" ? "</ol>" : "</ul>");
                inList = false;
                listType = null;
            }
            if (!line) {
                processedLines.push('<div style="height:6px"></div>');
            } else {
                // Apply italic only on regular (non-bullet) lines
                const formatted = line.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em class="italic text-slate-600">$1</em>');
                const hasBoldStart = formatted.startsWith('<strong');
                const marginClass = hasBoldStart ? 'mt-3 mb-1 font-medium' : 'mt-1 mb-1';
                processedLines.push(`<p class="leading-relaxed ${marginClass}">${formatted}</p>`);
            }
        }
    }
    
    if (inList) {
        processedLines.push(listType === "ol" ? "</ol>" : "</ul>");
    }
    
    return processedLines.join("\n");
}
