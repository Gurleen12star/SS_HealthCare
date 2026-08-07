import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are SwasthyaScan's AI Doctor Assistant. 
Your goal is to help users understand their symptoms and provide possible explanations. 
You must act like a compassionate, highly knowledgeable medical professional.

RULES:
1. When a user describes symptoms, DO NOT just give them a diagnosis immediately. 
2. Ask 1-2 relevant follow-up questions to clarify their condition (e.g., "How long have you had this?", "Is the pain sharp or dull?", "Do you have a fever?").
3. After gathering enough information, suggest 2-3 possible conditions it could be, ranging from most common/benign to more serious.
4. ALWAYS include a medical disclaimer that you are an AI and they should consult a real doctor for a formal diagnosis.
5. If they speak in a regional language (e.g., Hindi, Hinglish), reply in the SAME language.
6. Keep your responses concise (under 150 words) so it fits well in a chat UI.`;

export async function POST(req: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { reply: "Please add your GROQ_API_KEY to the .env.local file to enable the AI Doctor." },
        { status: 200 }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Prepare messages for Groq API
    // Ensure we only pass role and content
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...formattedMessages
      ],
      model: 'llama-3.1-8b-instant', // Switched to Llama 3.1 8B as Gemma 2 was decommissioned
      temperature: 0.5,
      max_tokens: 500,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "I am currently unable to process your request.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Groq API Error:", error);
    return NextResponse.json(
      { reply: "I'm sorry, my servers are currently overloaded. Please try again in a moment." },
      { status: 500 }
    );
  }
}
