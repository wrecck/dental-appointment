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
import { Plus, DollarSign, TrendingUp, CreditCard, Banknote } from "lucide-react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

async function getPaymentStats(clinicId: string) {
  const now = new Date();
  const thisMonth = startOfMonth(now);
  const lastMonth = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [payments, thisMonthTotal, lastMonthTotal] = await Promise.all([
    prisma.payment.findMany({
      where: { clinicId },
      include: { patient: true, treatment: true },
      orderBy: { date: "desc" },
      take: 50,
    }),
    prisma.payment.aggregate({
      where: { clinicId, date: { gte: thisMonth } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { clinicId, date: { gte: lastMonth, lte: lastMonthEnd } },
      _sum: { amount: true },
    }),
  ]);

  return {
    payments,
    thisMonthTotal: thisMonthTotal._sum.amount || 0,
    lastMonthTotal: lastMonthTotal._sum.amount || 0,
  };
}

const methodIcons: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4" />,
  card: <CreditCard className="h-4 w-4" />,
  "bank-transfer": <DollarSign className="h-4 w-4" />,
  insurance: <DollarSign className="h-4 w-4" />,
};

export default async function PaymentsPage() {
  const session = await auth();
  const clinicId = session?.user?.clinicId;

  if (!clinicId) return null;

  const { payments, thisMonthTotal, lastMonthTotal } = await getPaymentStats(clinicId);
  const growthPercent = lastMonthTotal > 0
    ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-muted-foreground">Track patient payments</p>
        </div>
        <Link href="/dashboard/payments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
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
            <DollarSign className="h-4 w-4 text-muted-foreground" />
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
              Growth
            </CardTitle>
            <TrendingUp className={`h-4 w-4 ${growthPercent >= 0 ? "text-green-600" : "text-red-600"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${growthPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
              {growthPercent >= 0 ? "+" : ""}{growthPercent.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No payments recorded yet</p>
              <Link href="/dashboard/payments/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Record First Payment
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/patients/${payment.patientId}`}
                        className="font-medium hover:underline"
                      >
                        {payment.patient.firstName} {payment.patient.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {payment.description || payment.treatment?.name || "Payment"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 capitalize">
                        {methodIcons[payment.method]}
                        {payment.method.replace("-", " ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={payment.status === "completed" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      +${payment.amount.toLocaleString()}
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
