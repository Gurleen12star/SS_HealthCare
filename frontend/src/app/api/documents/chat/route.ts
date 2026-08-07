import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { reply: "Please add your GROQ_API_KEY to the .env.local file to enable the AI Chat." },
        { status: 200 }
      );
    }

    const { messages, documentContext, queryType, language } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const langName = language === 'hi' ? 'Hindi' : language === 'pa' ? 'Punjabi' : language === 'bn' ? 'Bengali' : language === 'te' ? 'Telugu' : language === 'mr' ? 'Marathi' : language === 'ta' ? 'Tamil' : language === 'ur' ? 'Urdu' : language === 'gu' ? 'Gujarati' : language === 'kn' ? 'Kannada' : language === 'ml' ? 'Malayalam' : language === 'or' ? 'Odia' : 'English';

    const SYSTEM_PROMPT = `You are an expert medical AI assistant helping a patient understand their specific medical report.
You MUST rely ONLY on the extracted document text provided below. 

DOCUMENT CONTEXT:
${JSON.stringify(documentContext, null, 2)}

RULES:
1. If the user asks about a test value, extract it EXACTLY as written in the context and explain what it means in simple terms.
2. If the user asks if a symptom is explained by this document, analyze the document for relevant flags (like low hemoglobin explaining fatigue) and explain it.
3. Be compassionate and use very simple, non-jargon language.
4. Keep your response under 150 words.
5. ALWAYS add a disclaimer that you are an AI and they should consult a doctor.
6. CRITICAL: You MUST reply entirely in ${langName}. Do not use English unless it is a medical term that cannot be translated.`;

    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    // If it's a specific test/symptom extraction query, we inject a strong system instruction
    const finalSystemPrompt = queryType === 'extraction' 
      ? SYSTEM_PROMPT + "\n\nCRITICAL INSTRUCTION: The user is asking for a SPECIFIC test or symptom extraction. Search the document context carefully for exactly what they asked, and summarize the findings directly."
      : SYSTEM_PROMPT;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: finalSystemPrompt },
        ...formattedMessages
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 500,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "I am currently unable to process your request.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Groq Document Chat Error:", error);
    return NextResponse.json(
      { reply: "I'm sorry, I encountered an error analyzing the document. Please try again." },
      { status: 500 }
    );
  }
}
