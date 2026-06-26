import { useState } from "react";
import { Link } from "wouter";
import { useGetDashboardStats, useGetUpcomingTours, useListBookings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell, 
  AreaChart, 
  Area 
} from "recharts";
import { Users, Calendar, CheckCircle, Clock, ChevronRight, Loader2, ArrowRight, TrendingUp, Download, FileSpreadsheet, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { StatusBadge } from "@/components/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const exportBookingsToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  const headers = [
    "Booking ID",
    "Parent Name",
    "Phone",
    "Email",
    "Child Name",
    "Child Age",
    "Preferred Class",
    "Booking Date",
    "Time Slot",
    "Status",
    "Counsellor Assigned",
    "Referral Source",
    "Follow-up Date",
    "Created At"
  ];
  
  const csvRows = [
    headers.join(",")
  ];

  data.forEach((item) => {
    const values = [
      item.id,
      `"${(item.parentName || "").replace(/"/g, '""')}"`,
      `"${(item.phone || "").replace(/"/g, '""')}"`,
      `"${(item.email || "").replace(/"/g, '""')}"`,
      `"${(item.childName || "").replace(/"/g, '""')}"`,
      `"${(item.childAge || "").replace(/"/g, '""')}"`,
      `"${(item.preferredClass || "").replace(/"/g, '""')}"`,
      item.date,
      `"${(item.timeSlot || "").replace(/"/g, '""')}"`,
      item.status,
      `"${(item.assignedTo || "").replace(/"/g, '""')}"`,
      `"${(item.referralSource || "").replace(/"/g, '""')}"`,
      item.followUpDate || "",
      item.createdAt ? new Date(item.createdAt).toLocaleString() : ""
    ];
    csvRows.push(values.join(","));
  });

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const exportBookingsToPDF = (data: any[], title: string, subtitle?: string) => {
  if (!data || data.length === 0) return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "enquiry": return "Enquiry";
      case "tour_scheduled": return "Tour Scheduled";
      case "demo": return "Demo";
      case "follow_up": return "Follow Up";
      case "admission_confirmed": return "Admission Confirmed";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  const rows = data.map((item) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.id}</td>
      <td style="border: 1px solid #ddd; padding: 8px;"><strong>${item.parentName || ""}</strong><br/><small style="color: #666;">Child: ${item.childName || ""} (${item.childAge || ""})</small></td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.phone || ""}<br/><small style="color: #666;">${item.email || ""}</small></td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.date ? new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ""}<br/><small style="color: #666;">${item.timeSlot || ""}</small></td>
      <td style="border: 1px solid #ddd; padding: 8px;">${getStatusLabel(item.status)}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.assignedTo || "-"}</td>
    </tr>
  `).join("");

  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #333; margin: 20px; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #1e3a8a; }
          .report-info { text-align: right; font-size: 12px; color: #666; }
          h1 { font-size: 20px; margin: 0 0 5px 0; color: #111827; }
          .subtitle { font-size: 14px; color: #4b5563; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { border: 1px solid #ddd; padding: 8px; background-color: #f3f4f6; text-align: left; font-weight: 600; color: #374151; }
          tr:nth-child(even) { background-color: #f9fafb; }
          @media print {
            body { margin: 10px; }
            button { display: none; }
            @page { size: auto; margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">FirstCry Intellitots</div>
            <h1>${title}</h1>
            ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
          </div>
          <div class="report-info">
            <strong>Generated Date:</strong> ${today}<br/>
            <strong>Total Records:</strong> ${data.length}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">ID</th>
              <th style="width: 25%;">Parent & Child</th>
              <th style="width: 25%;">Contact Info</th>
              <th style="width: 18%;">Schedule</th>
              <th style="width: 12%;">Status</th>
              <th style="width: 12%;">Counsellor</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export function AdminDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: upcomingTours, isLoading: toursLoading } = useGetUpcomingTours();
  
  const queryParams = statusFilter && statusFilter !== "all" ? { status: statusFilter } : {};
  const { data: bookings, isLoading: bookingsLoading } = useListBookings(queryParams);
  const { data: allBookingsForChart, isLoading: chartLoading } = useListBookings({});

  const todayStr = new Date().toISOString().slice(0, 10);
  const followUpBookings = allBookingsForChart
    ? allBookingsForChart.filter(b => b.followUpDate && b.status !== "cancelled" && b.status !== "admission_confirmed")
      .sort((a, b) => a.followUpDate!.localeCompare(b.followUpDate!))
    : [];

  // Group all bookings by date for the trend area chart
  const bookingsByDate = allBookingsForChart 
    ? Object.entries(
        allBookingsForChart.reduce((acc: Record<string, number>, b) => {
          acc[b.date] = (acc[b.date] || 0) + 1;
          return acc;
        }, {})
      )
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  return (
    <div className="flex-1 p-6 md:p-8 bg-muted/20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of admissions and upcoming tours.</p>
          </div>
        </div>

        {/* Stats Row */}
        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-28 bg-muted/50 rounded-xl" />
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Enquiries</p>
                  <p className="text-3xl font-bold">{stats.enquiries}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Tours Scheduled</p>
                  <p className="text-3xl font-bold">{stats.tourScheduled}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Tours Today</p>
                  <p className="text-3xl font-bold">{stats.todayTours}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Admissions</p>
                  <p className="text-3xl font-bold">{stats.admissionConfirmed}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Visual Charts Row */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Conversion Funnel Bar Chart */}
            <Card className="shadow-sm border border-card-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Conversion Funnel
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72 pb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "Enquiry", count: stats.enquiries, fill: "hsl(190, 90%, 40%)" },
                    { name: "Scheduled", count: stats.tourScheduled, fill: "hsl(24, 95%, 53%)" },
                    { name: "Demo", count: stats.demo, fill: "hsl(270, 50%, 50%)" },
                    { name: "Follow Up", count: stats.followUp, fill: "hsl(45, 90%, 45%)" },
                    { name: "Admitted", count: stats.admissionConfirmed, fill: "hsl(142, 70%, 45%)" }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-xs" />
                    <YAxis tickLine={false} axisLine={false} className="text-xs" />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                      contentStyle={{ 
                        borderRadius: '0.75rem', 
                        borderColor: 'hsl(var(--border))',
                        backgroundColor: 'hsl(var(--card))',
                        color: 'hsl(var(--card-foreground))'
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {
                        [
                          { fill: "hsl(190, 90%, 40%)" },
                          { fill: "hsl(24, 95%, 53%)" },
                          { fill: "hsl(270, 50%, 50%)" },
                          { fill: "hsl(45, 90%, 45%)" },
                          { fill: "hsl(142, 70%, 45%)" }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Booking Trend Area Chart */}
            <Card className="shadow-sm border border-card-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Booking Trend Over Time
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72 pb-4">
                {chartLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : bookingsByDate.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={bookingsByDate}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        tickLine={false} 
                        axisLine={false}
                        className="text-xs"
                        tickFormatter={(str) => {
                          try {
                            return format(parseISO(str), "MMM d");
                          } catch {
                            return str;
                          }
                        }}
                      />
                      <YAxis tickLine={false} axisLine={false} allowDecimals={false} className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '0.75rem', 
                          borderColor: 'hsl(var(--border))',
                          backgroundColor: 'hsl(var(--card))',
                          color: 'hsl(var(--card-foreground))'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorCount)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                    <p>No booking trend data available.</p>
                    <p className="text-xs text-muted-foreground mt-1">Bookings will display chronologically once created.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Bookings List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4 border-b">
                <CardTitle className="text-lg font-semibold">Recent Bookings</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="enquiry">Enquiry</SelectItem>
                      <SelectItem value="tour_scheduled">Tour Scheduled</SelectItem>
                      <SelectItem value="demo">Demo</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                      <SelectItem value="admission_confirmed">Admission Confirmed</SelectItem>
                    </SelectContent>
                  </Select>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem 
                        onClick={() => exportBookingsToCSV(bookings || [], `bookings_filtered_${statusFilter || 'all'}`)}
                        disabled={!bookings || bookings.length === 0}
                        className="gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>Export Current View (CSV)</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => exportBookingsToPDF(bookings || [], "Filtered Admissions Report", `Status: ${statusFilter ? statusFilter.replace('_', ' ').toUpperCase() : 'ALL'}`)}
                        disabled={!bookings || bookings.length === 0}
                        className="gap-2"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Export Current View (PDF)</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => exportBookingsToCSV(allBookingsForChart || [], "bookings_all")}
                        disabled={!allBookingsForChart || allBookingsForChart.length === 0}
                        className="gap-2 border-t pt-2 mt-1"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>Export All Bookings (CSV)</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => exportBookingsToPDF(allBookingsForChart || [], "All Admissions Report", "All Bookings list")}
                        disabled={!allBookingsForChart || allBookingsForChart.length === 0}
                        className="gap-2"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Export All Bookings (PDF)</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {bookingsLoading ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : bookings && bookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parent & Child</TableHead>
                          <TableHead>Schedule</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((b) => (
                          <TableRow key={b.id} className="hover:bg-muted/30">
                            <TableCell>
                              <div className="font-medium text-foreground">{b.parentName}</div>
                              <div className="text-xs text-muted-foreground">{b.childName} ({b.childAge})</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{format(parseISO(b.date), "MMM d, yyyy")}</div>
                              <div className="text-xs text-muted-foreground">{b.timeSlot}</div>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={b.status} />
                            </TableCell>
                            <TableCell className="text-right">
                              <Link href={`/staff/bookings/${b.id}`}>
                                <Button variant="ghost" size="sm" className="h-8 gap-1">
                                  View <ChevronRight className="w-4 h-4" />
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <p>No bookings found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Upcoming Tours */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Tours
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {toursLoading ? (
                  <div className="py-10 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : upcomingTours && upcomingTours.length > 0 ? (
                  <div className="divide-y divide-border">
                    {upcomingTours.map((t) => (
                      <Link key={t.id} href={`/staff/bookings/${t.id}`}>
                        <div className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between group cursor-pointer">
                          <div>
                            <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                              {t.parentName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(parseISO(t.date), "MMM d")} at {t.timeSlot}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 duration-200" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No upcoming tours in the next 7 days.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="border-b pb-4 bg-yellow-50/10">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  Pending Follow-ups
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {bookingsLoading ? (
                  <div className="py-10 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : followUpBookings.length > 0 ? (
                  <div className="divide-y divide-border">
                    {followUpBookings.slice(0, 5).map((f) => {
                      const isOverdue = f.followUpDate < todayStr;
                      const isFollowUpToday = f.followUpDate === todayStr;
                      
                      return (
                        <Link key={f.id} href={`/staff/bookings/${f.id}`}>
                          <div className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between group cursor-pointer">
                            <div className="space-y-1">
                              <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                                {f.parentName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Child: {f.childName} ({f.childAge})
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                {(() => {
                                  if (!f.followUpDate) return "";
                                  try {
                                    const parsed = parseISO(f.followUpDate);
                                    if (!isNaN(parsed.getTime())) {
                                      return format(parsed, "MMM d, yyyy");
                                    }
                                  } catch (e) {}
                                  return f.followUpDate;
                                })()}
                              </p>
                            </div>
                            <div>
                              {isOverdue ? (
                                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                                  Overdue
                                </span>
                              ) : isFollowUpToday ? (
                                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold">
                                  Today
                                </span>
                              ) : (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                  Scheduled
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No pending follow-ups.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
