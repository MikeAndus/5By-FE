import { z } from "zod";

const TOPIC_VALUES = [
  "Politics",
  "Science",
  "History",
  "Art",
  "Current Affairs",
] as const;

const SESSION_STATUS_VALUES = ["in_progress", "complete"] as const;

const REVEALED_BY_VALUES = ["question", "guess", "auto"] as const;

const EVENT_TYPE_VALUES = [
  "question_asked",
  "question_answered",
  "letter_guessed",
  "word_guessed",
] as const;

export const TopicSchema = z.enum(TOPIC_VALUES);
export type Topic = z.infer<typeof TopicSchema>;

export const SessionStatusSchema = z.enum(SESSION_STATUS_VALUES);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export const RevealedBySchema = z.enum(REVEALED_BY_VALUES);
export type RevealedBy = z.infer<typeof RevealedBySchema>;

export const EventTypeSchema = z.enum(EVENT_TYPE_VALUES);
export type EventType = z.infer<typeof EventTypeSchema>;

export const CellSnapshotSchema = z
  .object({
    index: z.number().int(),
    row: z.number().int(),
    col: z.number().int(),
    revealed: z.boolean(),
    locked: z.boolean(),
    letter: z.string().regex(/^[A-Z]$/).nullable(),
    topics_used: z.array(TopicSchema),
    revealed_by: RevealedBySchema.nullable(),
  })
  .superRefine((cell, ctx) => {
    if (!cell.revealed) {
      if (cell.letter !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Unrevealed cells must have letter set to null.",
          path: ["letter"],
        });
      }

      if (cell.revealed_by !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Unrevealed cells must have revealed_by set to null.",
          path: ["revealed_by"],
        });
      }
    }
  });
export type CellSnapshot = z.infer<typeof CellSnapshotSchema>;

export const PlayerSnapshotSchema = z.object({
  player_number: z.number().int(),
  name: z.string().nullable(),
  score: z.number().int(),
  grid_id: z.string().uuid(),
  completed: z.boolean(),
  cells: z.array(CellSnapshotSchema),
});
export type PlayerSnapshot = z.infer<typeof PlayerSnapshotSchema>;

export const LastEventSchema = z.object({
  type: EventTypeSchema,
  created_at: z.string(),
  event_data: z.record(z.unknown()),
});
export type LastEvent = z.infer<typeof LastEventSchema>;

export const SessionSnapshotSchema = z
  .object({
    session_id: z.string().uuid(),
    status: SessionStatusSchema,
    current_turn: z.number().int(),
    topics: z.array(TopicSchema),
    players: z.array(PlayerSnapshotSchema).length(2),
    last_event: LastEventSchema.nullable(),
  })
  .superRefine((snapshot, ctx) => {
    const isCanonicalTopics =
      snapshot.topics.length === TOPIC_VALUES.length &&
      snapshot.topics.every((topic, index) => topic === TOPIC_VALUES[index]);

    if (!isCanonicalTopics) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Topics must match canonical values and order.",
        path: ["topics"],
      });
    }

    const playerNumbers = snapshot.players.map((player) => player.player_number);
    const uniquePlayerNumbers = new Set(playerNumbers);

    if (uniquePlayerNumbers.size !== snapshot.players.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Player numbers must be unique.",
        path: ["players"],
      });
    }

    if (!playerNumbers.includes(snapshot.current_turn)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "current_turn must point to an existing player_number.",
        path: ["current_turn"],
      });
    }
  });
export type SessionSnapshot = z.infer<typeof SessionSnapshotSchema>;
