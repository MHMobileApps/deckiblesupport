import { franc } from 'franc-min';
import { redactForLlm } from '@/lib/security/redaction';
import { draftSchema, DraftOutput } from './schema';
import { getLlmClient } from './client';

const SYSTEM_PROMPT = `You are a customer support drafting assistant for Deckible.
You do NOT send messages. You only propose drafts for an agent to review.
1) Always respond in the requester language. If uncertain, default to English.
2) Be polite, concise, and specific.
3) Ask at most 3 clarifying questions if necessary.
4) Provide actionable next steps.
5) Never fabricate product capabilities. If unsure, ask for clarification or suggest a safe check.
6) Never mention internal tools, internal URLs, API tokens, passwords, logs, or security details.
7) Never promise timelines.
8) Never ask for sensitive information like passwords.
9) Use short paragraphs and basic bullets only.
10) Do not use em dashes.`;

const DEVELOPER_PROMPT = `You will be given a Zendesk ticket and subset of comments. Produce STRICT JSON only matching schema.
Include summaryBullets, category, urgency, suggestedReply signed as \"Mark\", suggestedInternalNote in English, followUpQuestions if needed, redFlags for safety and compliance issues.`;

export async function generateDraft(payload: Record<string, unknown>, currentDraft?: string): Promise<DraftOutput> {
  const client = getLlmClient();
  const userPrompt = `Inputs: ${JSON.stringify(payload)}\nCurrentDraft: ${currentDraft ?? 'none'}\nTask: Output strict JSON only.`;
  const raw = await client.generate({
    system: SYSTEM_PROMPT,
    developer: DEVELOPER_PROMPT,
    user: redactForLlm(userPrompt),
  });

  const parsed = await parseOrRepair(raw, client);
  return parsed;
}

async function parseOrRepair(raw: string, client: ReturnType<typeof getLlmClient>): Promise<DraftOutput> {
  try {
    return draftSchema.parse(JSON.parse(raw));
  } catch {
    const repair = await client.generate({
      system: 'Return corrected JSON only',
      developer: 'Fix invalid JSON to match schema',
      user: raw,
    });
    try {
      return draftSchema.parse(JSON.parse(repair));
    } catch {
      return fallbackDraft(raw);
    }
  }
}

function fallbackDraft(text: string): DraftOutput {
  const code = franc(text || 'hello');
  const language = code === 'spa' ? 'es' : code === 'deu' ? 'de' : 'en';
  const reply = language === 'es'
    ? 'Hola, gracias por escribirnos. Lamentamos el inconveniente. ¿Puedes compartir más detalles para investigar? Te ayudaremos lo antes posible.\n\nMark'
    : language === 'de'
      ? 'Hallo, danke fur deine Nachricht. Es tut uns leid, dass es Probleme gibt. Kannst du mehr Details teilen, damit wir es prufen konnen?\n\nMark'
      : 'Hi, thanks for reaching out. Sorry you are running into this. Could you share a bit more detail so we can investigate and follow up?\n\nMark';
  return {
    language,
    detectedLanguageName: language,
    summaryBullets: ['Customer reported an issue.', 'Needs more detail for investigation.'],
    category: 'other',
    urgency: 'medium',
    confidence: 0.4,
    suggestedReply: reply,
    suggestedInternalNote: 'Fallback draft generated due to JSON parsing failure.',
    followUpQuestions: ['Can you share the exact steps you took?'],
    redFlags: [],
    nextSteps: ['Collect more details from requester']
  };
}
