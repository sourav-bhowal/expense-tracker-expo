import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import { prisma } from "./src/prisma";
import { rateLimitMiddleware } from "./src/middleware";
import { expenseSchema } from "./src/schema";

// Initialize Express application
const app: Application = express();
const PORT = process.env.PORT || 8000;

// Middleware setup
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(rateLimitMiddleware);

// Define routes
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to the Expense Tracker API. All systems operational.",
  });
});

app.post("/api/expenses", async (req: Request, res: Response) => {
  try {
    // Validate request body against the schema
    const parsedData = expenseSchema.safeParse(req.body);

    if (!parsedData.success) {
      return res
        .status(400)
        .json({ message: "Invalid data", errors: parsedData.error });
    }

    // Destructure validated data
    const { userId, title, description, category, amount, date } =
      parsedData.data;

    // Create new expense
    const expense = await prisma.expense.create({
      data: {
        userId,
        title,
        description,
        category,
        amount,
        date: date instanceof Date ? date : new Date(date), // Ensure date is a Date object
      },
    });

    if (!expense) {
      return res.status(500).json({ message: "Failed to create expense" });
    }

    res.status(201).json({
      message: "Expense added successfully",
      expense,
    });
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/expenses/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const expenses = await prisma.expense.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    if (!expenses || expenses.length === 0) {
      return res.status(404).json({ message: "No expenses found" });
    }

    const totalSpend = await prisma.expense.aggregate({
      _sum: {
        amount: true,
      },
      where: { userId, amount: { lt: 0 } },
    });

    const totalEarned = await prisma.expense.aggregate({
      _sum: {
        amount: true,
      },
      where: { userId, amount: { gt: 0 } },
    });

    const totalBalance =
      (totalEarned._sum.amount ?? 0) + (totalSpend._sum.amount ?? 0);

    res.status(200).json({
      expenses,
      totalSpend: totalSpend._sum.amount ?? 0,
      totalEarned: totalEarned._sum.amount ?? 0,
      totalBalance,
      message: "Expenses fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/api/expense/:id/:userId", async (req: Request, res: Response) => {
  const { id, userId } = req.params;

  try {
    const expense = await prisma.expense.delete({
      where: { id, userId },
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
