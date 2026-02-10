import { z } from "zod";

export const zUuid = z.string().uuid();

const SessionStatusSchema = z.enum(["in_progress", "complete"]);
const RevealedBySchema = z.enum(["question", "guess", "auto"]).nullable();

export const CellSchema = z
  .object({
    index: z.number().int().min(0).max(24),
    row: z.number().int().min(0).max(4),
    col: z.number().int().min(0).max(4),
    revealed: z.boolean(),
    letter: z.string().min(1).optional(),
    locked: z.boolean(),
    topics_used: z.array(z.string()),
    revealed_by: RevealedBySchema
  })
  .strict()
  .superRefine((cell, ctx) => {
    if (cell.revealed && !cell.letter) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["letter"],
        message: "Revealed cells must include a letter."
      });
    }

    if (!cell.revealed && cell.letter !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["letter"],
        message: "Hidden cells must not include a letter."
      });
    }
  });

export const PlayerSnapshotSchema = z
  .object({
    player_number: z.union([z.literal(1), z.literal(2)]),
    name: z.string().min(1).optional(),
    score: z.number(),
    grid_id: zUuid,
    cells: z.array(CellSchema),
    completed: z.boolean()
  })
  .strict();

const LastEventSchema = z
  .object({
    type: z.string().min(1),
    result: z.enum(["ok", "error"]).optional(),
    message_to_speak: z.string().optional()
  })
  .strict();

export const SessionSnapshotSchema = z
  .object({
    session_id: zUuid,
    status: SessionStatusSchema,
    current_turn: z.union([z.literal(1), z.literal(2)]),
    players: z.array(PlayerSnapshotSchema).min(1).max(2),
    last_event: LastEventSchema.optional()
  })
  .strict();

export type SessionSnapshot = z.infer<typeof SessionSnapshotSchema>;
