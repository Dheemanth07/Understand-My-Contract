// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// functions/simplify-doc/index.ts

declare const Deno: any;
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // allow all (or restrict to your frontend origin)
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }
    try {
        const { text, file_name } = await req.json();

        console.log("Received request to simplify text:", text);

        // Call OpenAI to simplify the text
        const response = await fetch(
            "https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${Deno.env.get(
                        "HUGGINGFACE_API_KEY"
                    )}`,
                },
                body: JSON.stringify({
                    inputs: `Simplify this legal text into plain understandable English. Please explain it clearly in 2-3 bullet points:\n\n${text}`,
                    parameters: { max_new_tokens: 500, temperature: 0.3 },
                }),
            }
        );

        console.log("LLaMA response status:", response.status);

        const responseData = await response.json();
        console.log("AI response", JSON.stringify(responseData, null, 2));

        let simplified = "No result";
        if (Array.isArray(responseData) && responseData.length > 0) {
            simplified = responseData[0].generated_text || "No result";
        }

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // use service_role key for writes
        );

        const { error } = await supabaseClient
            .from("documents_analysis")
            .insert({
                file_name,
                original_text: text,
                simplified_text: simplified,
            });

        if (error) {
            console.error("DB insert error:", error.message);
        }

        return new Response(JSON.stringify({ simplified }), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/simplify-doc' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
