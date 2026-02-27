import { z } from 'zod';

export const draftSchema = z.object({
  language: z.string(),
  detectedLanguageName: z.string(),
  summaryBullets: z.array(z.string()).min(2).max(5),
  category: z.enum([
    'billing',
    'technical_bug',
    'account_access',
    'feature_request',
    'content_deck_issue',
    'creator_tools_issue',
    'policy_refund',
    'other'
  ]),
  urgency: z.enum(['low', 'medium', 'high']),
  confidence: z.number().min(0).max(1),
  suggestedReply: z.string(),
  suggestedInternalNote: z.string(),
  followUpQuestions: z.array(z.string()).max(3),
  redFlags: z.array(z.string()).max(5),
  nextSteps: z.array(z.string()).min(1).max(5)
});

export type DraftOutput = z.infer<typeof draftSchema>;
