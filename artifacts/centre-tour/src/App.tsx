import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { DynamicBackground } from "@/components/DynamicBackground";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ParentNavbar } from "@/components/ParentNavbar";
import { StaffNavbar } from "@/components/StaffNavbar";
import NotFound from "@/pages/not-found";
import { Home } from "@/pages/Home";
import { BookTour } from "@/pages/BookTour";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { BookingDetail } from "@/pages/BookingDetail";
import { CalendarView } from "@/pages/CalendarView";
import { StaffLogin } from "@/pages/StaffLogin";
import { StaffManagement } from "@/pages/StaffManagement";
import { ReferralsManagement } from "@/pages/ReferralsManagement";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <StaffNavbar />
      {children}
    </div>
  );
}

function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <ParentNavbar />
      {children}
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Parent-facing routes */}
      <Route path="/">
        <ParentLayout>
          <Home />
        </ParentLayout>
      </Route>
      <Route path="/book">
        <ParentLayout>
          <BookTour />
        </ParentLayout>
      </Route>

      {/* Staff login — no navbar */}
      <Route path="/staff/login" component={StaffLogin} />

      {/* Staff management */}
      <Route path="/staff/accounts">
        <ProtectedRoute>
          <StaffLayout>
            <StaffManagement />
          </StaffLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/staff/referrals">
        <ProtectedRoute>
          <StaffLayout>
            <ReferralsManagement />
          </StaffLayout>
        </ProtectedRoute>
      </Route>

      {/* Staff-only routes */}
      <Route path="/staff/dashboard">
        <ProtectedRoute>
          <StaffLayout>
            <AdminDashboard />
          </StaffLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/staff/bookings/:id">
        {(params: any) => {
          if (!params) return null;
          return (
            <ProtectedRoute>
              <StaffLayout>
                <BookingDetail id={Number(params.id)} />
              </StaffLayout>
            </ProtectedRoute>
          );
        }}
      </Route>
      <Route path="/staff/calendar">
        <ProtectedRoute>
          <StaffLayout>
            <CalendarView />
          </StaffLayout>
        </ProtectedRoute>
      </Route>

      {/* Legacy redirects — keep old /admin and /calendar working */}
      <Route path="/admin">
        <ProtectedRoute>
          <StaffLayout>
            <AdminDashboard />
          </StaffLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/bookings/:id">
        {(params: any) => {
          if (!params) return null;
          return (
            <ProtectedRoute>
              <StaffLayout>
                <BookingDetail id={Number(params.id)} />
              </StaffLayout>
            </ProtectedRoute>
          );
        }}
      </Route>
      <Route path="/calendar">
        <ProtectedRoute>
          <StaffLayout>
            <CalendarView />
          </StaffLayout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <Router />
            </AuthProvider>
          </WouterRouter>
          <Toaster />
          <DynamicBackground />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
