// src/pages/Companies.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Building2 } from "lucide-react";
import { Company } from "@/types/company";
import { createCompany, getCompanies } from "@/lib/companyDb";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const loadCompanies = async () => {
    const data = await getCompanies();
    setCompanies(data);
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleAddCompany = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createCompany({ name, address });
      setName("");
      setAddress("");
      await loadCompanies();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Companies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 space-y-2">
              {companies.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No companies added yet.
                </p>
              )}

              <div className="space-y-2">
                {companies.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between border rounded-lg px-3 py-2 hover:bg-muted cursor-pointer"
                    onClick={() =>
                      navigate(`/companies/${c.id}/employees`)
                    }
                  >
                    <div>
                      <div className="font-medium">{c.name}</div>
                      {c.address && (
                        <div className="text-xs text-muted-foreground">
                          {c.address}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/companies/${c.id}/employees`);
                      }}
                    >
                      View Employees
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Add New Company</h3>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-2">
                <Label>Address (optional)</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleAddCompany}
                disabled={!name.trim() || loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Company
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
