import { z } from "zod";
import { GuessDirectionSchema } from "@/lib/api/guess-types";

export const AutoRevealCellSchema = z
  .object({
    cell_index: z.number().int().min(0).max(24),
    row: z.number().int().min(0).max(4),
    col: z.number().int().min(0).max(4),
    letter: z.string().regex(/^[A-Z]$/),
  })
  .strict();
export type AutoRevealCell = z.infer<typeof AutoRevealCellSchema>;

export const LetterGuessedEventDataSchema = z
  .object({
    cell_index: z.number().int().min(0).max(24),
    row: z.number().int().min(0).max(4),
    col: z.number().int().min(0).max(4),
    guess: z.string().regex(/^[A-Z]$/),
    correct: z.boolean(),
    revealed_letter: z.string().regex(/^[A-Z]$/).nullable(),
    score_delta: z.number().int(),
    opponent_score_delta: z.number().int(),
    locks_enqueued: z.array(z.number().int().min(0).max(24)),
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
export type LetterGuessedEventData = z.infer<typeof LetterGuessedEventDataSchema>;

export const WordRevealedCellSchema = z
  .object({
    cell_index: z.number().int().min(0).max(24),
    row: z.number().int().min(0).max(4),
    col: z.number().int().min(0).max(4),
    letter: z.string().regex(/^[A-Z]$/),
  })
  .strict();
export type WordRevealedCell = z.infer<typeof WordRevealedCellSchema>;

export const WordGuessedEventDataSchema = z
  .object({
    direction: GuessDirectionSchema,
    index: z.number().int().min(0).max(4),
    guess: z.string().regex(/^[A-Z]{5}$/),
    correct: z.boolean(),
    score_delta: z.number().int(),
    opponent_score_delta: z.number().int(),
    revealed_cells: z.array(WordRevealedCellSchema),
    auto_reveals: z.array(AutoRevealCellSchema),
    locks_enqueued: z.array(z.number().int().min(0).max(24)),
  })
  .strict();
export type WordGuessedEventData = z.infer<typeof WordGuessedEventDataSchema>;
