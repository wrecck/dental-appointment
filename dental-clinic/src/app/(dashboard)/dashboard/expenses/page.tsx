import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Receipt, TrendingDown, Package, Zap, Home } from "lucide-react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from "date-fns";

async function getExpenseStats(clinicId: string) {
  const now = new Date();
  const thisMonth = startOfMonth(now);
  const thisWeek = startOfWeek(now);
  const lastMonth = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [expenses, thisMonthTotal, thisWeekTotal, lastMonthTotal, byCategory] = await Promise.all([
    prisma.expense.findMany({
      where: { clinicId },
      orderBy: { date: "desc" },
      take: 50,
    }),
    prisma.expense.aggregate({
      where: { clinicId, date: { gte: thisMonth } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { clinicId, date: { gte: thisWeek } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { clinicId, date: { gte: lastMonth, lte: lastMonthEnd } },
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ["category"],
      where: { clinicId, date: { gte: thisMonth } },
      _sum: { amount: true },
    }),
  ]);

  return {
    expenses,
    thisMonthTotal: thisMonthTotal._sum.amount || 0,
    thisWeekTotal: thisWeekTotal._sum.amount || 0,
    lastMonthTotal: lastMonthTotal._sum.amount || 0,
    byCategory,
  };
}

const categoryIcons: Record<string, React.ReactNode> = {
  supplies: <Package className="h-4 w-4" />,
  equipment: <Zap className="h-4 w-4" />,
  rent: <Home className="h-4 w-4" />,
  utilities: <Zap className="h-4 w-4" />,
  salary: <Receipt className="h-4 w-4" />,
  marketing: <Receipt className="h-4 w-4" />,
  other: <Receipt className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  supplies: "bg-blue-100 text-blue-700",
  equipment: "bg-purple-100 text-purple-700",
  rent: "bg-orange-100 text-orange-700",
  utilities: "bg-yellow-100 text-yellow-700",
  salary: "bg-green-100 text-green-700",
  marketing: "bg-pink-100 text-pink-700",
  other: "bg-gray-100 text-gray-700",
};

export default async function ExpensesPage() {
  const session = await auth();
  const clinicId = session?.user?.clinicId;

  if (!clinicId) return null;

  const { expenses, thisMonthTotal, thisWeekTotal, lastMonthTotal, byCategory } =
    await getExpenseStats(clinicId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-muted-foreground">Track clinic expenses</p>
        </div>
        <Link href="/dashboard/expenses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
            <Receipt className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${thisWeekTotal.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <Receipt className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${thisMonthTotal.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Month
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${lastMonthTotal.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Change
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${thisMonthTotal <= lastMonthTotal ? "text-green-600" : "text-red-600"}`}>
              {lastMonthTotal > 0
                ? `${thisMonthTotal <= lastMonthTotal ? "-" : "+"}${Math.abs(
                    ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
                  ).toFixed(1)}%`
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {byCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>This Month by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {byCategory.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center gap-2 p-3 rounded-lg border"
                >
                  <Badge className={`capitalize ${categoryColors[cat.category]}`}>
                    {cat.category}
                  </Badge>
                  <span className="font-medium">
                    ${(cat._sum.amount || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No expenses recorded yet</p>
              <Link href="/dashboard/expenses/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Expense
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {format(new Date(expense.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge className={`capitalize ${categoryColors[expense.category]}`}>
                        <span className="mr-1">{categoryIcons[expense.category]}</span>
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.vendor || "-"}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      -${expense.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
