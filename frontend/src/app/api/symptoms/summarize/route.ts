import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { symptoms } = await req.json();
    if (!symptoms) {
      return NextResponse.json({ error: "No symptoms provided" }, { status: 400 });
    }

    // 1. Fetch all patient records
    const { data: reports } = await supabase
      .from('reports')
      .select('id, created_at, report_type, extracted_data')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false });

    // 2. Prepare the context for the LLM
    const recordsContext = (reports || []).map(r => {
      const data = r.extracted_data || {};
      return `
RECORD ID: ${r.id}
Date: ${data.report_date || r.created_at}
Type: ${data.subtype || r.report_type}
Findings/Tests: ${JSON.stringify(data.tests || [])} ${JSON.stringify(data.findings || [])}
      `.trim();
    }).join("\n\n---\n\n");

    const systemPrompt = `You are an expert medical data retrieval assistant.
Your job is to read the patient's current symptoms and search through their provided medical records.
Select ONLY the records that are highly relevant to the symptoms.
DO NOT diagnose the patient. DO NOT say "Your symptoms are caused by X".
Instead, output a JSON structure summarizing the relevant records and explaining WHY they were selected.

Patient Symptoms: "${symptoms}"

Patient Records:
${recordsContext}

Return strict JSON in this format exactly:
{
  "relevant_count": 2,
  "total_records": 5,
  "summary_text": "These records were selected because they contain tests relevant to your symptoms. For example, your CBC shows low hemoglobin.",
  "relevant_records": [
    {
      "record_id": "the uuid",
      "title": "CBC - 7 Aug 2026",
      "relevant_findings": ["Hemoglobin 9.4 g/dL (Below Range)"],
      "explanation": "Hemoglobin helps carry oxygen. Low levels can cause tiredness and weakness."
    }
  ]
}
Reply with ONLY the raw JSON object. No markdown formatting.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "llama3-70b-8192", // Using large model for complex reasoning
      temperature: 0,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "{}";
    
    let resultData = {};
    try {
      const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      resultData = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse Groq response:", responseText);
      throw new Error("Failed to parse AI response");
    }

    return NextResponse.json(resultData);

  } catch (err: any) {
    console.error("Summarize Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
