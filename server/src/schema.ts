import z from "zod";

export const expenseSchema = z.object({
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  category: z.string(),
  amount: z.number().min(-1000000).max(1000000), // Adjust limits as necessary
  date: z.date().optional().default(new Date()), // Default to current date if not provided
});
