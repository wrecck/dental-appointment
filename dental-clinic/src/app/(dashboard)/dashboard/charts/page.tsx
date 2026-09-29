"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface ToothCondition {
  toothNumber: number;
  condition: string;
  surface?: string;
  notes?: string;
}

const conditions = [
  { value: "healthy", label: "Healthy", color: "bg-green-500" },
  { value: "cavity", label: "Cavity", color: "bg-yellow-500" },
  { value: "filling", label: "Filling", color: "bg-blue-500" },
  { value: "crown", label: "Crown", color: "bg-purple-500" },
  { value: "extraction", label: "Extraction", color: "bg-red-500" },
  { value: "root-canal", label: "Root Canal", color: "bg-orange-500" },
  { value: "missing", label: "Missing", color: "bg-gray-400" },
  { value: "implant", label: "Implant", color: "bg-cyan-500" },
];

const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export default function DentalChartsPage() {
  const { data: session } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [chartData, setChartData] = useState<ToothCondition[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchPatients() {
      const res = await fetch("/api/patients");
      if (res.ok) setPatients(await res.json());
    }
    fetchPatients();
  }, []);

  useEffect(() => {
    async function fetchChart() {
      if (!selectedPatient) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/charts?patientId=${selectedPatient}`);
        if (res.ok) {
          const data = await res.json();
          setChartData(data);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchChart();
  }, [selectedPatient]);

  const getToothCondition = (toothNumber: number) => {
    return chartData.find((t) => t.toothNumber === toothNumber);
  };

  const updateTooth = (condition: string) => {
    if (!selectedTooth) return;
    
    setChartData((prev) => {
      const existing = prev.findIndex((t) => t.toothNumber === selectedTooth);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], condition };
        return updated;
      }
      return [...prev, { toothNumber: selectedTooth, condition }];
    });
  };

  const saveChart = async () => {
    if (!selectedPatient) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/charts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient,
          chartData,
        }),
      });
      if (res.ok) {
        toast.success("Dental chart saved successfully");
      } else {
        throw new Error("Failed to save");
      }
    } catch {
      toast.error("Failed to save dental chart");
    } finally {
      setIsSaving(false);
    }
  };

  const ToothButton = ({ tooth }: { tooth: number }) => {
    const condition = getToothCondition(tooth);
    const conditionInfo = conditions.find((c) => c.value === condition?.condition);

    return (
      <button
        onClick={() => setSelectedTooth(tooth)}
        className={`w-10 h-14 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
          selectedTooth === tooth
            ? "border-blue-500 ring-2 ring-blue-200"
            : "border-gray-300 hover:border-gray-400"
        } ${conditionInfo?.color || "bg-white"}`}
      >
        <span className={`text-xs font-bold ${conditionInfo ? "text-white" : "text-gray-700"}`}>
          {tooth}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dental Charts</h1>
          <p className="text-muted-foreground">
            Record and view patient dental conditions
          </p>
        </div>
      </div>

      {/* Patient Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Select Patient</Label>
              <Select value={selectedPatient} onValueChange={(v) => v && setSelectedPatient(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Search and select patient..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} - {patient.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPatient && (
              <Button onClick={saveChart} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Chart
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPatient && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Dental Chart Visualization */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Dental Chart</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Upper Jaw */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2 text-center">
                      Upper Jaw (Maxilla)
                    </p>
                    <div className="flex justify-center gap-1">
                      {upperTeeth.map((tooth) => (
                        <ToothButton key={tooth} tooth={tooth} />
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-dashed" />

                  {/* Lower Jaw */}
                  <div>
                    <div className="flex justify-center gap-1">
                      {lowerTeeth.map((tooth) => (
                        <ToothButton key={tooth} tooth={tooth} />
                      ))}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mt-2 text-center">
                      Lower Jaw (Mandible)
                    </p>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-2 justify-center pt-4 border-t">
                    {conditions.map((c) => (
                      <Badge
                        key={c.value}
                        variant="outline"
                        className={`${c.color} text-white border-0`}
                      >
                        {c.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Condition Selector */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedTooth ? `Tooth #${selectedTooth}` : "Select a Tooth"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTooth ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {conditions.map((c) => (
                        <Button
                          key={c.value}
                          variant="outline"
                          size="sm"
                          className={`justify-start ${
                            getToothCondition(selectedTooth)?.condition === c.value
                              ? `${c.color} text-white hover:${c.color}`
                              : ""
                          }`}
                          onClick={() => updateTooth(c.value)}
                        >
                          <div className={`w-3 h-3 rounded-full ${c.color} mr-2`} />
                          {c.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Click on a condition to update tooth #{selectedTooth}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Click on a tooth in the chart to view or update its condition
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedPatient && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Select a patient to view or edit their dental chart
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
