"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  Users,
  Plus,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Shield,
  Trash2,
  Edit,
} from "lucide-react";
import { toast } from "sonner";

interface ClinicInfo {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [clinic, setClinic] = useState<ClinicInfo | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);

  const isOwner = session?.user?.role === "owner";

  useEffect(() => {
    async function fetchData() {
      try {
        const [clinicRes, usersRes] = await Promise.all([
          fetch("/api/clinic"),
          fetch("/api/users/all"),
        ]);
        if (clinicRes.ok) setClinic(await clinicRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const saveClinicInfo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") || null,
      address: formData.get("address") || null,
    };

    try {
      const response = await fetch("/api/clinic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to save");

      const updated = await response.json();
      setClinic(updated);
      toast.success("Clinic information updated");
    } catch {
      toast.error("Failed to save clinic information");
    } finally {
      setIsSaving(false);
    }
  };

  const addUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAddingUser(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    };

    try {
      const response = await fetch("/api/users/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to add user");
      }

      const newUser = await response.json();
      setUsers([...users, newUser]);
      setShowAddUserDialog(false);
      toast.success("Team member added successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add user");
    } finally {
      setIsAddingUser(false);
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) throw new Error("Failed to update");

      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, isActive: !isActive } : u
        )
      );
      toast.success(`User ${!isActive ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update user status");
    }
  };

  const roleColors: Record<string, string> = {
    owner: "bg-purple-100 text-purple-700",
    dentist: "bg-blue-100 text-blue-700",
    receptionist: "bg-green-100 text-green-700",
    assistant: "bg-orange-100 text-orange-700",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-muted-foreground">
          Manage your clinic settings and team
        </p>
      </div>

      <Tabs defaultValue="clinic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clinic" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Clinic Info
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Members
          </TabsTrigger>
        </TabsList>

        {/* Clinic Info Tab */}
        <TabsContent value="clinic">
          <Card>
            <CardHeader>
              <CardTitle>Clinic Information</CardTitle>
              <CardDescription>
                Update your clinic&apos;s basic information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveClinicInfo} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Clinic Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={clinic?.name}
                      required
                      disabled={!isOwner || isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={clinic?.email}
                        required
                        className="pl-10"
                        disabled={!isOwner || isSaving}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={clinic?.phone || ""}
                        className="pl-10"
                        disabled={!isOwner || isSaving}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      name="address"
                      defaultValue={clinic?.address || ""}
                      className="pl-10"
                      rows={2}
                      disabled={!isOwner || isSaving}
                    />
                  </div>
                </div>
                {isOwner && (
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                )}
                {!isOwner && (
                  <p className="text-sm text-muted-foreground">
                    Only clinic owners can edit clinic information.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Members Tab */}
        <TabsContent value="team">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage dentists and staff accounts
                </CardDescription>
              </div>
              {isOwner && (
                <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                  <DialogTrigger
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={addUser}>
                      <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                        <DialogDescription>
                          Create a new account for a team member
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="newName">Name *</Label>
                          <Input
                            id="newName"
                            name="name"
                            required
                            disabled={isAddingUser}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newEmail">Email *</Label>
                          <Input
                            id="newEmail"
                            name="email"
                            type="email"
                            required
                            disabled={isAddingUser}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">Password *</Label>
                          <Input
                            id="newPassword"
                            name="password"
                            type="password"
                            minLength={8}
                            required
                            disabled={isAddingUser}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newRole">Role *</Label>
                          <Select name="role" defaultValue="dentist" disabled={isAddingUser}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dentist">Dentist</SelectItem>
                              <SelectItem value="receptionist">Receptionist</SelectItem>
                              <SelectItem value="assistant">Assistant</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddUserDialog(false)}
                          disabled={isAddingUser}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isAddingUser}>
                          {isAddingUser && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Add Member
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      !user.isActive ? "opacity-50 bg-gray-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.name}</p>
                          <Badge className={`capitalize ${roleColors[user.role]}`}>
                            {user.role === "owner" && <Shield className="h-3 w-3 mr-1" />}
                            {user.role}
                          </Badge>
                          {!user.isActive && (
                            <Badge variant="outline" className="text-red-600">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {isOwner && user.role !== "owner" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleUserStatus(user.id, user.isActive)}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
