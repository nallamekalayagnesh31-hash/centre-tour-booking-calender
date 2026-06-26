import { useState } from "react";
import { useLocation } from "wouter";
import { useStaffLogin, useRegisterStaff, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Eye, EyeOff, AlertCircle } from "lucide-react";

export function StaffLogin() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "counsellor" | "centre_head">("counsellor");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = useStaffLogin({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetMeQueryKey(), data);
        navigate("/staff/dashboard");
      },
      onError: () => {
        setError("Invalid username or password. Please try again.");
      },
    },
  });

  const registerMutation = useRegisterStaff({
    mutation: {
      onSuccess: () => {
        // Automatically log in after registration
        loginMutation.mutate({ data: { username, password } });
      },
      onError: (err: any) => {
        const errMsg = err?.data?.error || "Registration failed. Username may already exist.";
        setError(errMsg);
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (isRegistering) {
      if (!username.trim() || !password.trim() || !name.trim()) {
        setError("Please fill in all fields.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      registerMutation.mutate({ data: { username, password, name, role } });
    } else {
      if (!username.trim() || !password.trim()) {
        setError("Please enter both username and password.");
        return;
      }
      loginMutation.mutate({ data: { username, password } });
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
    setUsername("");
    setPassword("");
    setName("");
    setRole("counsellor");
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground font-bold text-2xl mb-4 shadow-lg shadow-primary/30">
            FC
          </div>
          <h1 className="text-2xl font-bold text-foreground">FirstCry Intellitots</h1>
          <p className="text-muted-foreground mt-1">Staff Portal</p>
        </div>

        <Card className="border border-white/50 shadow-xl bg-white/70 backdrop-blur-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              {isRegistering ? "Create Staff Account" : "Staff Login"}
            </CardTitle>
            <CardDescription>
              {isRegistering 
                ? "Register a new staff member account" 
                : "Sign in to access the admissions dashboard"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegistering && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="h-11"
                />
              </div>

              {isRegistering && (
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={role} 
                    onValueChange={(val) => setRole(val as any)}
                  >
                    <SelectTrigger id="role" className="h-11">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="centre_head">Centre Head</SelectItem>
                      <SelectItem value="counsellor">Counsellor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 rounded-full text-base"
                disabled={isPending}
              >
                {isPending 
                  ? (isRegistering ? "Registering..." : "Signing in...") 
                  : (isRegistering ? "Register Account" : "Sign In")}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <button
                type="button"
                onClick={toggleMode}
                className="text-primary hover:underline font-medium text-center"
              >
                {isRegistering 
                  ? "Already have an account? Sign In" 
                  : "Don't have an account? Create one"}
              </button>
            </div>

          </CardContent>
        </Card>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          <a href="/" className="hover:text-primary transition-colors">
            Back to Parent Portal
          </a>
        </p>
      </div>
    </div>
  );
}
