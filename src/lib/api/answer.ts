import { z } from "zod";
import { TopicSchema } from "@/lib/api/session-snapshot";

export const AnswerQuestionRequestSchema = z
  .object({
    player_number: z.union([z.literal(1), z.literal(2)]),
    answer: z.string().trim().min(1).max(100),
  })
  .strict();

export type AnswerQuestionRequest = z.infer<typeof AnswerQuestionRequestSchema>;

export const QuestionAnsweredEventDataSchema = z
  .object({
    cell_index: z.number().int().min(0).max(24),
    row: z.number().int().min(0).max(4),
    col: z.number().int().min(0).max(4),
    topic: TopicSchema,
    answer: z.string().min(1),
    correct: z.boolean(),
    revealed_letter: z.string().regex(/^[A-Z]$/).nullable(),
    lock_cleared_cell_index: z.number().int().min(0).max(24).nullable(),
  })
  .strict()
  .superRefine((eventData, ctx) => {
    if (eventData.correct && eventData.revealed_letter === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "revealed_letter is required when correct is true.",
        path: ["revealed_letter"],
      });
    }

    if (!eventData.correct && eventData.revealed_letter !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "revealed_letter must be null when correct is false.",
        path: ["revealed_letter"],
      });
    }
  });

export type QuestionAnsweredEventData = z.infer<typeof QuestionAnsweredEventDataSchema>;
