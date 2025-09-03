// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// functions/simplify-doc/index.ts

declare const Deno: any;
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient} from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
    try {
        const { text, file_name } = await req.json();

        console.log("Received request to simplify text:", text);

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content:
                                "You simplify legal text into plain English.",
                        },
                        { role: "user", content: text },
                    ],
                }),
            }
        ).then((res) => res.json());

        console.log("OpenAI response status:", response.status);

        const simplified =
            response.choices?.[0]?.message?.content ?? "No result";

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // use service_role key for writes
        );

        const { error } = await supabaseClient
            .from("document_analysis")
            .insert({
                file_name,
                original: text,
                simplified,
            });

        if (error) {
            console.error("DB insert error:", error.message);
        }

        return new Response(JSON.stringify({ simplified }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
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
