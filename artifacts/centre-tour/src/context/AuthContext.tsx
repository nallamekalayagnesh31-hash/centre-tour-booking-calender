import { createContext, useContext, type ReactNode } from "react";
import { useGetMe, useStaffLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import type { StaffProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface AuthContextValue {
  staff: StaffProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  staff: null,
  isLoading: true,
  isAuthenticated: false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: staff, isLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
      staleTime: 1000 * 60 * 5,
    },
  });

  const logoutMutation = useStaffLogout({
    mutation: {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/staff/login");
      },
    },
  });

  return (
    <AuthContext.Provider
      value={{
        staff: staff ?? null,
        isLoading,
        isAuthenticated: !!staff,
        logout: () => logoutMutation.mutate(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
