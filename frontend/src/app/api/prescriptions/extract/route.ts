import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}_prescription.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("medical_documents")
      .upload(filePath, file);

    if (uploadError) {
      console.warn("Storage error (ignoring to allow AI processing):", uploadError);
    }

    // 2. Convert file to Base64 for Groq Vision
    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");
    const mimeType = file.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // 3. Analyze with Groq Qwen Vision
    const systemPrompt = `You are a medical data extractor specializing in parsing prescriptions. 
Analyze the provided prescription image and extract all medications into the exact JSON structure below.
Do NOT output anything else except the raw JSON. If you are unsure, set confidence lower.

{
  "medications": [
    {
      "name_raw": "medicine name as written",
      "strength": "e.g., 625 mg",
      "dose": "e.g., 1 tablet",
      "frequency": "e.g., BD, OD, twice daily",
      "food_relation": "e.g., after_meals, before_meals, none",
      "duration": "e.g., 5 days",
      "route": "oral, topical, injection",
      "confidence": 0.95
    }
  ]
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: systemPrompt },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      model: "qwen/qwen3.6-27b",
      temperature: 0,
      response_format: { type: "json_object" }
    });

    const aiContent = chatCompletion.choices[0]?.message?.content || "{}";
    const extractedData = JSON.parse(aiContent);

    // 4. Save to Database
    const { data: prescription, error: dbError } = await supabase
      .from('prescriptions')
      .insert({
        patient_id: user.id,
        file_path: uploadError ? "failed_upload.jpg" : filePath,
        ocr_text: JSON.stringify(extractedData)
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      return NextResponse.json({ error: "Failed to save prescription to database" }, { status: 500 });
    }

    return NextResponse.json(prescription);

  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
