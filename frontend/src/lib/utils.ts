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
        
    // 2. Convert bold: **text** -> <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    
    // 3. Process lines to handle bullet points and numbered points
    const lines = html.split("\n");
    let inList = false;
    let listType: "ul" | "ol" | null = null;
    const processedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Match bullet points starting with * or - or •
        const bulletMatch = line.match(/^[\*\-\u2022]\s+(.*)/);
        // Match numbered points starting with number + dot/parenthesis
        const numberMatch = line.match(/^(\d+)[\.\)]\s+(.*)/);
        
        if (bulletMatch) {
            if (!inList || listType !== "ul") {
                if (inList) processedLines.push(listType === "ol" ? "</ol>" : "</ul>");
                processedLines.push('<ul class="list-disc pl-5 my-2 space-y-1">');
                inList = true;
                listType = "ul";
            }
            processedLines.push(`<li>${bulletMatch[1]}</li>`);
        } else if (numberMatch) {
            if (!inList || listType !== "ol") {
                if (inList) processedLines.push(listType === "ol" ? "</ol>" : "</ul>");
                processedLines.push('<ol class="list-decimal pl-5 my-2 space-y-1">');
                inList = true;
                listType = "ol";
            }
            processedLines.push(`<li>${numberMatch[2]}</li>`);
        } else {
            if (inList) {
                processedLines.push(listType === "ol" ? "</ol>" : "</ul>");
                inList = false;
                listType = null;
            }
            // Retain normal lines with pre-wrap behavior
            processedLines.push(line ? `<p class="mb-2">${line}</p>` : '<div class="h-2"></div>');
        }
    }
    
    if (inList) {
        processedLines.push(listType === "ol" ? "</ol>" : "</ul>");
    }
    
    return processedLines.join("\n");
}
