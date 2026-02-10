import { z } from "zod";

export const GuessDirectionSchema = z.enum(["across", "down"]);
export type GuessDirection = z.infer<typeof GuessDirectionSchema>;

export const GuessLetterRequestSchema = z
  .object({
    player_number: z.union([z.literal(1), z.literal(2)]),
    cell_index: z.number().int().min(0).max(24),
    letter: z.string().regex(/^[A-Za-z]$/),
  })
  .strict();
export type GuessLetterRequest = z.infer<typeof GuessLetterRequestSchema>;

export const GuessWordRequestSchema = z
  .object({
    player_number: z.union([z.literal(1), z.literal(2)]),
    direction: GuessDirectionSchema,
    index: z.number().int().min(0).max(4),
    word: z.string().regex(/^[A-Za-z]{5}$/),
  })
  .strict();
export type GuessWordRequest = z.infer<typeof GuessWordRequestSchema>;
