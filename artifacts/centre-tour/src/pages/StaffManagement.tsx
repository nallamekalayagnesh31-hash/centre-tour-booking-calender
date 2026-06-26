import { useState } from "react";
import {
  useListStaff,
  useRegisterStaff,
  useDeleteStaff,
  getListStaffQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
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
import { useUpdateStaffPassword } from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus,
  Trash2,
  ShieldCheck,
  User,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  counsellor: "Counsellor",
  centre_head: "Centre Head",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 border-purple-200",
  counsellor: "bg-blue-100 text-blue-700 border-blue-200",
  centre_head: "bg-orange-100 text-orange-700 border-orange-200",
};

export function StaffManagement() {
  const { staff: currentStaff } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: staffList, isLoading } = useListStaff();

  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
const [resetTarget, setResetTarget] = useState<{ id: number; name: string } | null>(null);
const [newPassword, setNewPassword] = useState("");
const [resetError, setResetError] = useState("");

  // Form state
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "counsellor",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  const registerMutation = useRegisterStaff({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStaffQueryKey() });
        toast({ title: "Staff account created successfully" });
        setShowForm(false);
        setForm({ name: "", username: "", password: "", role: "counsellor" });
        setFormError("");
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? "Failed to create account";
        setFormError(msg);
      },
    },
  });

  const resetPasswordMutation = useUpdateStaffPassword({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStaffQueryKey() });
        toast({ title: "Password reset successfully" });
        setResetTarget(null);
        setNewPassword("");
        setResetError("");
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? "Failed to reset password";
        setResetError(msg);
      },
    },
  });

  const deleteMutation = useDeleteStaff({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListStaffQueryKey() });
        toast({ title: "Staff account removed" });
        setDeleteTarget(null);
      },
      onError: () => {
        toast({ title: "Failed to delete account", variant: "destructive" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      setFormError("All fields are required.");
      return;
    }
    if (form.password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    registerMutation.mutate({
      data: {
        name: form.name.trim(),
        username: form.username.trim().toLowerCase(),
        password: form.password,
        role: form.role as "admin" | "counsellor" | "centre_head",
      },
    });
  };

  const isAdmin = currentStaff?.role === "admin";

  return (
    <div className="flex-1 p-6 md:p-8 bg-muted/20">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Staff Accounts</h1>
            <p className="text-muted-foreground mt-1">
              Manage login accounts for your admissions team.
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => { setShowForm(true); setFormError(""); }}
              className="rounded-full gap-2 self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              Register New Staff
            </Button>
          )}
        </div>

        {/* Staff List */}
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg">Team Members</CardTitle>
            <CardDescription>
              {staffList?.length ?? 0} account{staffList?.length !== 1 ? "s" : ""} registered
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-16 flex justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
            ) : staffList && staffList.length > 0 ? (
              <ul className="divide-y divide-border">
                {staffList.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{member.name}</p>
                          {member.id === currentStaff?.id && (
                            <span className="text-xs text-muted-foreground">(you)</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">@{member.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${ROLE_COLORS[member.role] ?? ""}`}
                      >
                        {ROLE_LABELS[member.role] ?? member.role}
                      </span>

                      {isAdmin && member.id !== currentStaff?.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                            onClick={() =>
                              setDeleteTarget({ id: member.id, name: member.name })
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full ml-1"
                            onClick={() => setResetTarget({ id: member.id, name: member.name })}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                No staff accounts found.
              </div>
            )}
          </CardContent>
        </Card>

        {!isAdmin && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-sm">
            <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>Only admin accounts can register or remove staff members. Contact your admin to make changes.</p>
          </div>
        )}
      </div>

      {/* Register Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); setFormError(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Register New Staff
            </DialogTitle>
            <DialogDescription>
              Create a login account for a new team member.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Full Name</Label>
              <Input
                id="reg-name"
                placeholder="e.g. Ms. Ananya"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-username">Username</Label>
              <Input
                id="reg-username"
                placeholder="e.g. ananya"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="off"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              {isAdmin && (
               <>
                 <Label htmlFor="reg-password">Password</Label>
                 <div className="relative">
                   <Input
                     id="reg-password"
                     type={showPassword ? "text" : "password"}
                     placeholder="Min. 6 characters"
                     value={form.password}
                     onChange={(e) => setForm({ ...form, password: e.target.value })}
                     autoComplete="new-password"
                     className="h-10 pr-10"
                   />
                   <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                   >
                     {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                   </button>
                 </div>
               </>
             )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-role">Role</Label>
              <Select
                value={form.role}
                onValueChange={(val) => setForm({ ...form, role: val })}
              >
                <SelectTrigger id="reg-role" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="counsellor">Counsellor</SelectItem>
                  <SelectItem value="centre_head">Centre Head</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formError && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={registerMutation.isPending} className="gap-2">
                {registerMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create Account
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Remove Staff Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{deleteTarget?.name}</strong>? They will immediately lose access to the staff portal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate({ id: deleteTarget.id });
                }
              }}
            >
              {deleteMutation.isPending ? "Removing..." : "Yes, Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={!!resetTarget}
        onOpenChange={(open) => { if (!open) setResetTarget(null); }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Reset Password for {resetTarget?.name}
            </DialogTitle>
            <DialogDescription>
              Enter a new password for this staff member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Label htmlFor="reset-password">New Password</Label>
            <Input
              id="reset-password"
              type="password"
              placeholder="Min. 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-10"
            />
            {resetError && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {resetError}
              </div>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={resetPasswordMutation.isPending || newPassword.length < 6}
              onClick={() => {
                if (resetTarget) {
                  resetPasswordMutation.mutate({
                    id: resetTarget.id,
                    data: { password: newPassword },
                  });
                }
              }}
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
