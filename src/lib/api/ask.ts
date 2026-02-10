import { z } from "zod";
import { TopicSchema } from "@/lib/api/session-snapshot";

export const AskQuestionRequestSchema = z
  .object({
    player_number: z.union([z.literal(1), z.literal(2)]),
    cell_index: z.number().int().min(0).max(24),
    topic: TopicSchema,
  })
  .strict();

export type AskQuestionRequest = z.infer<typeof AskQuestionRequestSchema>;

export const QuestionGeneratorSchema = z.enum(["stub_v1", "openai_responses_v1"]);
export type QuestionGenerator = z.infer<typeof QuestionGeneratorSchema>;

export const QuestionAskedEventDataSchema = z
  .object({
    cell_index: z.number().int().min(0).max(24),
    row: z.number().int().min(0).max(4),
    col: z.number().int().min(0).max(4),
    topic: TopicSchema,
    question_text: z.string().min(1).max(500),
    answer: z.string().min(1),
    acceptable_variants: z.array(z.string().min(1)).min(1),
    generator: QuestionGeneratorSchema,
  })
  .strict();

export type QuestionAskedEventData = z.infer<typeof QuestionAskedEventDataSchema>;
