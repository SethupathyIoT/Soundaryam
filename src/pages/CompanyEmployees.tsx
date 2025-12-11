// src/pages/CompanyEmployees.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Company, Employee } from "@/types/company";
import {
  getCompanyById,
  getEmployeesByCompany,
  createEmployee,
  addEmployeeTransaction,
} from "@/lib/companyDb";

import {
  ArrowLeft,
  Plus,
  IndianRupee,
  Wallet,
  Eye,
  Printer,
} from "lucide-react";

export default function CompanyEmployeesPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();

  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // Add Employee
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmployeeCode, setNewEmployeeCode] = useState("");

  // Payment dialog
  const [payOpen, setPayOpen] = useState(false);
  const [payEmployee, setPayEmployee] = useState<Employee | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDescription, setPayDescription] = useState("");

  // NEW FIELDS FOR PAYMENT
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [collectorName, setCollectorName] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentTime, setPaymentTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );

  // After confirm: Show Print or Exit
  const [showPrintPrompt, setShowPrintPrompt] = useState(false);

  const loadData = async () => {
    if (!companyId) return;
    const c = await getCompanyById(companyId);
    const emps = await getEmployeesByCompany(companyId);
    setCompany(c || null);
    setEmployees(emps);
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  const handleAddEmployee = async () => {
    if (!companyId || !newName.trim() || !newEmployeeCode.trim()) return;
    setLoading(true);
    try {
      await createEmployee({
        companyId,
        name: newName,
        phone: newPhone,
        employeeCode: newEmployeeCode,
      });

      setNewName("");
      setNewPhone("");
      setNewEmployeeCode("");

      await loadData();
    } finally {
      setLoading(false);
    }
  };

  const openPayDialog = (employee: Employee) => {
    setPayEmployee(employee);
    setPayAmount("");
    setPayDescription("");
    setCollectorName("");
    setPaymentMethod("Cash");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentTime(new Date().toTimeString().slice(0, 5));
    setPayOpen(true);
  };

  const handlePay = async () => {
    if (!payEmployee) return;

    const value = Number(payAmount);
    if (!value || value <= 0) return;

    await addEmployeeTransaction({
      employeeId: payEmployee.id,
      type: "PAYMENT",
      amount: value,
      description: payDescription || "Payment",

      paymentMethod,
      collectorName,
      paymentDate,
      paymentTime,
    });

    setPayOpen(false);
    await loadData();

    // NOW SHOW PRINT PROMPT
    setShowPrintPrompt(true);
  };

  const totalOutstanding = employees.reduce(
    (sum, e) => sum + (e.activeBalance || 0),
    0
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="outline" size="sm" onClick={() => navigate("/companies")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h2 className="text-xl font-semibold">{company?.name || "Company"}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Employees</span>
            <span className="flex items-center text-sm text-muted-foreground">
              <Wallet className="h-4 w-4 mr-1" />
              Total Outstanding: ₹{totalOutstanding.toFixed(2)}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">

            {/* EMPLOYEE LIST */}
            <div className="md:col-span-2 space-y-2">
              {employees.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No employees added yet.
                </p>
              )}

              <div className="space-y-2">
                {employees.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between border rounded-lg px-3 py-2"
                  >
                    <div>
                      <div className="font-medium">
                        {e.name}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({e.employeeCode})
                        </span>
                      </div>
                      {e.phone && (
                        <div className="text-xs text-muted-foreground">
                          {e.phone}
                        </div>
                      )}
                      <div className="text-xs">
                        Balance:{" "}
                        <span
                          className={
                            e.activeBalance > 0
                              ? "text-red-600"
                              : e.activeBalance < 0
                              ? "text-green-600"
                              : "text-muted-foreground"
                          }
                        >
                          ₹{e.activeBalance.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/employees/${e.id}/account`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Account
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openPayDialog(e)}
                      >
                        <IndianRupee className="h-4 w-4 mr-1" />
                        Pay
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ADD EMPLOYEE */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Add Employee</h3>

              <div className="space-y-2">
                <Label>Employee ID</Label>
                <Input
                  value={newEmployeeCode}
                  onChange={(e) => setNewEmployeeCode(e.target.value)}
                  placeholder="EMP-123 or STAFF-01"
                />
              </div>

              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Employee name"
                />
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <Button
                className="w-full"
                disabled={!newName.trim() || !newEmployeeCode.trim() || loading}
                onClick={handleAddEmployee}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Employee
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PAYMENT DIALOG */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Pay – {payEmployee?.name} ({payEmployee?.employeeCode})
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">

            <div className="space-y-1">
              <Label>Amount</Label>
              <Input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <Label>Payment Method</Label>
              <select
                className="border rounded-md p-2 w-full"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Other</option>
              </select>
            </div>

            {/* Collector Name */}
            <div className="space-y-1">
              <Label>Collector Name</Label>
              <Input
                value={collectorName}
                onChange={(e) => setCollectorName(e.target.value)}
                placeholder="Who collected the payment?"
              />
            </div>

            {/* Payment Date */}
            <div className="space-y-1">
              <Label>Date</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            {/* Payment Time */}
            <div className="space-y-1">
              <Label>Time</Label>
              <Input
                type="time"
                value={paymentTime}
                onChange={(e) => setPaymentTime(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label>Description (optional)</Label>
              <Input
                value={payDescription}
                onChange={(e) => setPayDescription(e.target.value)}
                placeholder="e.g. cash payment"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePay} disabled={!Number(payAmount)}>
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PRINT OR EXIT PROMPT */}
      <Dialog open={showPrintPrompt} onOpenChange={setShowPrintPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Successful</DialogTitle>
          </DialogHeader>

          <p>Would you like to print the receipt?</p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrintPrompt(false)}>
              Exit
            </Button>
            <Button
              onClick={() => {
                window.print();
                setShowPrintPrompt(false);
              }}
            >
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
