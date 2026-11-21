import { z } from "zod";
import { uuid } from "./common";

// markNotificationsRead(ids) (PRD §13.1, F-NTF-01). No ids means all of the caller's notifications.
export const markNotificationsReadSchema = z.object({
  ids: z.array(uuid).min(1).max(50).optional(),
});
