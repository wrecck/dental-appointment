"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Send,
  Clock,
  Users,
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  patient: Patient;
  smsReminder: boolean;
  smsSent: boolean;
}

export default function SMSPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [patientsRes, appointmentsRes] = await Promise.all([
          fetch("/api/patients"),
          fetch("/api/appointments/upcoming"),
        ]);
        if (patientsRes.ok) setPatients(await patientsRes.json());
        if (appointmentsRes.ok) setUpcomingAppointments(await appointmentsRes.json());
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const templates = [
    {
      name: "Appointment Reminder",
      message: "Hi {name}, this is a reminder about your dental appointment on {date} at {time}. Please reply YES to confirm or call us to reschedule.",
    },
    {
      name: "Follow-up",
      message: "Hi {name}, we hope you're doing well after your recent visit. If you have any questions or concerns, please don't hesitate to contact us.",
    },
    {
      name: "Recall",
      message: "Hi {name}, it's time for your regular dental checkup. Please call us or visit our website to schedule your appointment.",
    },
    {
      name: "Thank You",
      message: "Thank you for visiting our clinic today, {name}. We appreciate your trust in us. Have a great day!",
    },
  ];

  const sendSMS = async () => {
    if (selectedPatients.length === 0) {
      toast.error("Please select at least one patient");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientIds: selectedPatients,
          message,
        }),
      });

      if (!response.ok) throw new Error("Failed to send SMS");

      toast.success(`SMS sent to ${selectedPatients.length} patient(s)`);
      setSelectedPatients([]);
      setMessage("");
    } catch {
      toast.error("Failed to send SMS. Please check your SMS configuration.");
    } finally {
      setIsSending(false);
    }
  };

  const sendReminders = async () => {
    const appointmentsToRemind = upcomingAppointments.filter(
      (apt) => apt.smsReminder && !apt.smsSent
    );

    if (appointmentsToRemind.length === 0) {
      toast.info("No pending reminders to send");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/sms/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentIds: appointmentsToRemind.map((a) => a.id),
        }),
      });

      if (!response.ok) throw new Error("Failed to send reminders");

      toast.success(`Reminders sent for ${appointmentsToRemind.length} appointment(s)`);
      
      // Refresh appointments
      const res = await fetch("/api/appointments/upcoming");
      if (res.ok) setUpcomingAppointments(await res.json());
    } catch {
      toast.error("Failed to send reminders");
    } finally {
      setIsSending(false);
    }
  };

  const togglePatient = (patientId: string) => {
    setSelectedPatients((prev) =>
      prev.includes(patientId)
        ? prev.filter((id) => id !== patientId)
        : [...prev, patientId]
    );
  };

  const selectAllPatients = () => {
    setSelectedPatients(patients.map((p) => p.id));
  };

  const clearSelection = () => {
    setSelectedPatients([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMS Notifications</h1>
          <p className="text-muted-foreground">
            Send SMS to patients and appointment reminders
          </p>
        </div>
      </div>

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send SMS
          </TabsTrigger>
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Appointment Reminders
          </TabsTrigger>
        </TabsList>

        {/* Send SMS Tab */}
        <TabsContent value="send" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Patient Selection */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Patients
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllPatients}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {patients.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => togglePatient(patient.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedPatients.includes(patient.id)
                            ? "bg-blue-50 border-blue-200"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div>
                          <p className="font-medium">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {patient.phone}
                          </p>
                        </div>
                        {selectedPatients.includes(patient.id) && (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {selectedPatients.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    {selectedPatients.length} patient(s) selected
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Message Composer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Compose Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Quick Templates</Label>
                  <Select
                    onValueChange={(value) => {
                      const template = templates.find((t) => t.name === value);
                      if (template) setMessage(template.message);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.name} value={template.name}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{name}"} for patient name, {"{date}"} for appointment date,{" "}
                    {"{time}"} for appointment time
                  </p>
                </div>

                <Button
                  onClick={sendSMS}
                  disabled={isSending || selectedPatients.length === 0}
                  className="w-full"
                >
                  {isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send SMS to {selectedPatients.length} Patient(s)
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appointment Reminders Tab */}
        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Appointments
              </CardTitle>
              <Button onClick={sendReminders} disabled={isSending}>
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send All Pending Reminders
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No upcoming appointments
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-lg font-bold">
                            {format(new Date(apt.date), "d")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(apt.date), "MMM")}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">
                            {apt.patient.firstName} {apt.patient.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {apt.startTime} • {apt.patient.phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {apt.smsReminder ? (
                          apt.smsSent ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Sent
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )
                        ) : (
                          <Badge variant="outline">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            No Reminder
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
