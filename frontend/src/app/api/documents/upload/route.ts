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

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("medical_documents") // Ensure this bucket exists!
      .upload(filePath, file);

    if (uploadError) {
      console.warn("Storage error (ignoring to allow AI processing):", uploadError);
    }

    // 2. Convert file to Base64 for Groq Vision
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    
    // Determine mime type
    let mimeType = file.type;
    if (!mimeType.startsWith("image/")) {
      // If it's a PDF, we might need to handle it differently.
      // But Groq Vision API currently only supports images (jpeg, png, webp, gif).
      // For MVP, we assume the user uploads images of their reports.
      mimeType = "image/jpeg";
    }

    // 3. Call Groq Vision for OCR and Extraction
    const prompt = `You are a medical document analyzer. Analyze the following medical document image.
Extract the details into a strict JSON format exactly like this:
{
  "document_type": "LAB_REPORT | RADIOLOGY_REPORT | PRESCRIPTION | DISCHARGE_SUMMARY | OTHER",
  "subtype": "e.g., CBC, MRI Brain, etc.",
  "report_date": "YYYY-MM-DD or null",
  "hospital_or_lab": "name of lab or null",
  "doctor": "name of doctor or null",
  "tests": [
    { "name": "Hemoglobin", "value": "9.4", "unit": "g/dL", "reference_range": "12-15", "is_out_of_range": true }
  ],
  "findings": ["Any textual findings or conclusions"],
  "simple_explanation": "A very simple, patient-friendly explanation of ONLY the out-of-range values or key findings. Do NOT diagnose the patient. Just explain what the values mean in simple language."
}
Reply ONLY with the raw JSON object. Do not include markdown formatting or backticks.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      model: "qwen/qwen3.6-27b",
      temperature: 0,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "{}";
    
    // Attempt to parse JSON safely
    let extractedData = {};
    try {
      // Sometimes models wrap in ```json ... ```
      const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      extractedData = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse Groq response as JSON:", responseText);
      extractedData = { error: "Failed to parse data", raw: responseText };
    }

    // 4. Save to Database
    const { data: reportRecord, error: dbError } = await supabase
      .from("reports")
      .insert({
        patient_id: user.id,
        file_path: filePath,
        report_type: (extractedData as any).document_type || "OTHER",
        status: "analyzed",
        extracted_data: extractedData
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB Insert error:", dbError);
      return NextResponse.json({ error: "Failed to save record" }, { status: 500 });
    }

    return NextResponse.json({ success: true, report: reportRecord });

  } catch (err: any) {
    console.error("Upload Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
