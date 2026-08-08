// @ts-nocheck
import { groq } from '@ai-sdk/groq';
import { streamText, tool } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await streamText({
    model: groq('llama-3.3-70b-versatile'),
    messages,
    system: `You are Swasthya Health Agent, a patient-facing assistant. 
Your job is to help users find, understand, and organize their existing health information. 
You are NOT a doctor. You must NOT diagnose or prescribe medicines. 
Always use tools to fetch REAL user data. Do not invent data. 
When asked to generate a PDF summary, use the generate_health_summary_pdf tool.`,
    tools: {
      search_health_records: tool({
        description: 'Search the authenticated patient\'s records (screenings and reports).',
        parameters: z.object({
          query: z.string().optional(),
          screening_type: z.string().optional(),
          risk_level: z.string().optional()
        }),
        execute: async (args: any) => {
          let req = supabase.from('screenings').select('*').eq('patient_id', user.id);
          if (args.screening_type) req = req.eq('screening_type', args.screening_type);
          if (args.risk_level) req = req.eq('risk_level', args.risk_level);
          const { data: screenings } = await req;
          
          let reportReq = supabase.from('reports').select('*').eq('patient_id', user.id);
          const { data: reports } = await reportReq;
          
          return {
            screenings: screenings || [],
            reports: reports || []
          };
        }
      }),
      get_screening_record: tool({
        description: 'Get details of a specific screening record by ID',
        parameters: z.object({
          screening_id: z.string()
        }),
        execute: async (args: any) => {
          const { data } = await supabase.from('screenings').select('*').eq('id', args.screening_id).eq('patient_id', user.id).single();
          return data || { error: 'Not found' };
        }
      }),
      get_follow_up: tool({
        description: 'Get follow-up status for a screening record',
        parameters: z.object({
          screening_id: z.string()
        }),
        execute: async (args: any) => {
          const { data: followups } = await supabase.from('followups').select('*').eq('patient_id', user.id);
          if (!followups) return { error: 'Not found' };
          const linked = followups.find((f: any) => {
            try { return JSON.parse(f.reason).screening_id === args.screening_id; } catch { return false; }
          });
          if (linked) {
            try { return { status: linked.status, note: JSON.parse(linked.reason).note, date: linked.created_at }; } catch { return linked; }
          }
          return { error: 'No follow up found' };
        }
      }),
      get_relevant_health_history: tool({
        description: 'Find relevant records based on current symptoms',
        parameters: z.object({
          symptoms: z.array(z.string())
        }),
        execute: async (args: any) => {
          const { data: screenings } = await supabase.from('screenings').select('*').eq('patient_id', user.id);
          const { data: reports } = await supabase.from('reports').select('*').eq('patient_id', user.id);
          return {
            message: `Retrieved all records. Filter them based on symptoms: ${(args.symptoms || []).join(', ')}`,
            screenings: screenings || [],
            reports: reports || []
          };
        }
      }),
      get_medications: tool({
        description: 'Get medications stored for the patient',
        parameters: z.object({}),
        execute: async () => {
          const { data: pres } = await supabase.from('prescriptions').select('id').eq('patient_id', user.id);
          if (!pres || pres.length === 0) return { medications: [] };
          const ids = pres.map((p: any) => p.id);
          const { data: meds } = await supabase.from('medications').select('*').in('prescription_id', ids);
          return { medications: meds || [] };
        }
      }),
      get_medical_document: tool({
        description: 'Get a medical report document by ID',
        parameters: z.object({ document_id: z.string() }),
        execute: async (args: any) => {
          const { data } = await supabase.from('reports').select('*').eq('id', args.document_id).eq('patient_id', user.id).single();
          return data || { error: 'Not found' };
        }
      }),
      create_patient_summary: tool({
        description: 'Create a patient-friendly summary string combining retrieved records',
        parameters: z.object({
          summary_text: z.string()
        }),
        execute: async (args: any) => {
          return { status: 'Summary created', summary_text: args.summary_text };
        }
      }),
      generate_health_summary_pdf: tool({
        description: 'Triggers the client UI to generate a downloadable PDF for a screening ID',
        parameters: z.object({
          screening_id: z.string()
        }),
        execute: async (args: any) => {
          return { trigger_pdf_download: true, screening_id: args.screening_id };
        }
      })
    }
  });

  return result.toTextStreamResponse();
}
