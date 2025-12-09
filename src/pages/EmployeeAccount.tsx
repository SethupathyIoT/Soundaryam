// src/pages/EmployeeAccount.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmployeeAccountSummary } from "@/lib/companyDb";
import { getEmployeeAccountSummary } from "@/lib/companyDb";
import { ArrowLeft, IndianRupee, ReceiptText } from "lucide-react";

export default function EmployeeAccountPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<EmployeeAccountSummary | null>(null);

  const load = async () => {
    if (!employeeId) return;
    const data = await getEmployeeAccountSummary(employeeId);
    setSummary(data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  if (!employeeId) {
    return <div className="p-4">Employee not found.</div>;
  }

  if (!summary) {
    return <div className="p-4">Loading…</div>;
  }

  const { employee, transactions, totalBills, totalPayments, closingBalance } =
    summary;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h2 className="text-xl font-semibold">
          {employee.name} ({employee.employeeCode})
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5" />
              Account Ledger
            </span>
            <span className="text-sm">
              Balance:{" "}
              <span
                className={
                  closingBalance > 0
                    ? "text-red-600 dark:text-red-400"
                    : closingBalance < 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                }
              >
                ₹{closingBalance.toFixed(2)}
              </span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 mb-4 text-sm">
            <div className="border rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Employee</div>
              <div className="font-medium">{employee.name}</div>
              <div className="text-xs text-muted-foreground">
                {employee.employeeCode}
              </div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Total Bills</div>
              <div className="font-semibold flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                {totalBills.toFixed(2)}
              </div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Total Payments</div>
              <div className="font-semibold flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                {totalPayments.toFixed(2)}
              </div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-xs text-muted-foreground">Closing Balance</div>
              <div className="font-semibold flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                {closingBalance.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Ledger table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left py-1 px-2">Date / Time</th>
                  <th className="text-left py-1 px-2">Type</th>
                  <th className="text-right py-1 px-2">Amount</th>
                  <th className="text-right py-1 px-2">Balance</th>
                  <th className="text-left py-1 px-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-1 px-2">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                    <td className="py-1 px-2">
                      {t.type === "BILL" ? "Bill" : "Payment"}
                    </td>
                    <td className="py-1 px-2 text-right">
                      {t.type === "BILL" ? "+" : "-"}₹
                      {t.amount.toFixed(2)}
                    </td>
                    <td className="py-1 px-2 text-right">
                      ₹{t.runningBalance.toFixed(2)}
                    </td>
                    <td className="py-1 px-2">
                      {t.description || "-"}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-3 text-center text-muted-foreground text-xs"
                    >
                      No transactions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
