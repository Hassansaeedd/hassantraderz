// server/src/routes/expense.routes.js — Shop Expenses Backend API
import { Router } from 'express';
import { authMiddleware, asyncHandler } from '../middleware/auth.middleware.js';
import { prisma } from '../config/database.js';
import * as apiRes from '../utils/apiResponse.js';

const router = Router();
router.use(authMiddleware);

// GET /expenses — List all expenses with summary totals
router.get('/', asyncHandler(async (req, res) => {
  const { category, from, to } = req.query;
  const where = {};
  if (category) where.category = category;
  if (from || to) {
    where.expenseDate = {};
    if (from) where.expenseDate.gte = new Date(from);
    if (to)   where.expenseDate.lte = new Date(to);
  }

  const [expenses, totalAmount] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
      include: { user: { select: { fullName: true } } },
    }),
    prisma.expense.aggregate({
      where,
      _sum: { amount: true },
    }),
  ]);

  return apiRes.success(res, {
    expenses,
    totalExpenses: totalAmount._sum.amount || 0,
  });
}));

// POST /expenses — Record new expense
router.post('/', asyncHandler(async (req, res) => {
  const { title, category, amount, paymentMethod = 'CASH', reference, notes, expenseDate } = req.body;

  const expense = await prisma.expense.create({
    data: {
      title,
      category,
      amount: Number(amount),
      paymentMethod,
      reference: reference || null,
      notes: notes || null,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      userId: req.user.userId,
    },
    include: {
      user: { select: { fullName: true } },
    },
  });

  return apiRes.created(res, expense, 'Expense recorded successfully');
}));

// DELETE /expenses/:id — Delete an expense
router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.expense.delete({
    where: { id: req.params.id },
  });
  return apiRes.success(res, null, 'Expense deleted');
}));

export default router;
