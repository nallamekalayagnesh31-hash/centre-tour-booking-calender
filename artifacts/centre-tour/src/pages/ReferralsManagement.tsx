import { useState } from "react";
import {
  useListReferralRewards,
  useClaimReferralReward,
  getListReferralRewardsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gift, Search, Check, Clock, Award, Users, ShieldCheck, Download, FileSpreadsheet, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { StatusBadge } from "@/components/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const exportReferralsToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  const headers = [
    "Referral ID",
    "Referrer Name",
    "Referrer Phone",
    "Referrer Email",
    "Referee Parent",
    "Referee Child",
    "Referee Booking Date",
    "Reward Status",
    "Created At",
    "Last Updated"
  ];
  
  const csvRows = [
    headers.join(",")
  ];

  data.forEach((item) => {
    const values = [
      item.id,
      `"${(item.referrerName || "").replace(/"/g, '""')}"`,
      `"${(item.referrerPhone || "").replace(/"/g, '""')}"`,
      `"${(item.referrerEmail || "").replace(/"/g, '""')}"`,
      `"${(item.refereeParentName || "").replace(/"/g, '""')}"`,
      `"${(item.refereeChildName || "").replace(/"/g, '""')}"`,
      item.refereeBookingDate || "",
      item.rewardStatus,
      item.createdAt ? new Date(item.createdAt).toLocaleString() : "",
      item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ""
    ];
    csvRows.push(values.join(","));
  });

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const exportReferralsToPDF = (data: any[], title: string, subtitle?: string) => {
  if (!data || data.length === 0) return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const rows = data.map((item) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.id}</td>
      <td style="border: 1px solid #ddd; padding: 8px;"><strong>${item.referrerName || ""}</strong><br/><small style="color: #666;">${item.referrerPhone || ""}</small></td>
      <td style="border: 1px solid #ddd; padding: 8px;"><strong>${item.refereeParentName || ""}</strong><br/><small style="color: #666;">Child: ${item.refereeChildName || ""} (Date: ${item.refereeBookingDate || ""})</small></td>
      <td style="border: 1px solid #ddd; padding: 8px; text-transform: uppercase; font-weight: bold; color: ${item.rewardStatus === 'eligible' ? '#059669' : item.rewardStatus === 'claimed' ? '#4b5563' : '#d97706'};">${item.rewardStatus}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}</td>
    </tr>
  `).join("");

  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #333; margin: 20px; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #065f46; }
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
              <th style="width: 10%;">ID</th>
              <th style="width: 30%;">Referrer (Who Referred)</th>
              <th style="width: 30%;">Referee (Parent & Child)</th>
              <th style="width: 15%;">Reward Status</th>
              <th style="width: 15%;">Created Date</th>
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

export function ReferralsManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: referrals, isLoading } = useListReferralRewards();

  const claimRewardMutation = useClaimReferralReward({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListReferralRewardsQueryKey() });
        toast({
          title: "Reward Marked as Claimed",
          description: `Successfully claimed referral reward for ${data.referrerName}.`,
        });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? "Failed to claim reward";
        toast({
          title: "Claim Failed",
          description: msg,
          variant: "destructive",
        });
      },
    },
  });

  const handleClaim = (id: number) => {
    claimRewardMutation.mutate({ id });
  };

  // Filter and search logic
  const filteredReferrals = referrals?.filter((ref) => {
    const matchesStatus =
      statusFilter === "all" || ref.rewardStatus === statusFilter;

    const matchesSearch =
      ref.referrerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.referrerPhone.includes(searchQuery) ||
      ref.refereeParentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.refereeChildName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  }) ?? [];

  // Stats calculation
  const totalCount = referrals?.length ?? 0;
  const pendingCount = referrals?.filter((r) => r.rewardStatus === "pending").length ?? 0;
  const eligibleCount = referrals?.filter((r) => r.rewardStatus === "eligible").length ?? 0;
  const claimedCount = referrals?.filter((r) => r.rewardStatus === "claimed").length ?? 0;

  const REWARD_STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200",
    eligible: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 animate-pulse",
    claimed: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300 border-slate-200",
  };

  return (
    <div className="flex-1 p-6 md:p-8 bg-muted/20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Gift className="w-8 h-8 text-primary" />
            Referrals & Rewards
          </h1>
          <p className="text-muted-foreground mt-1">
            Track customer referrals and manage rewards when admissions are confirmed.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Referrals</p>
                <p className="text-3xl font-bold">{totalCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Pending Confirmation</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Eligible for Reward</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{eligibleCount}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center animate-bounce">
                <Award className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Claimed Rewards</p>
                <p className="text-3xl font-bold text-slate-600 dark:text-slate-400">{claimedCount}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search referrals..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Filter Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="eligible">Eligible</SelectItem>
                  <SelectItem value="claimed">Claimed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem 
                  onClick={() => exportReferralsToCSV(filteredReferrals, `referrals_filtered_${statusFilter}`)}
                  disabled={filteredReferrals.length === 0}
                  className="gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export Current View (CSV)</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => exportReferralsToPDF(filteredReferrals, "Filtered Referrals Report", `Status: ${statusFilter.toUpperCase()}`)}
                  disabled={filteredReferrals.length === 0}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Export Current View (PDF)</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => exportReferralsToCSV(referrals || [], "referrals_all")}
                  disabled={!referrals || referrals.length === 0}
                  className="gap-2 border-t pt-2 mt-1"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export All Referrals (CSV)</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => exportReferralsToPDF(referrals || [], "All Referrals & Rewards Report", "All referrals and reward statuses")}
                  disabled={!referrals || referrals.length === 0}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Export All Referrals (PDF)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table/Content Card */}
        <Card className="shadow-sm border">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg">Referrals Ledger</CardTitle>
            <CardDescription>
              Ledger of parent-referred tour bookings and reward statuses.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-16 flex justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
            ) : filteredReferrals.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referrer (Who Referred)</TableHead>
                      <TableHead>Referee Parent (Child Name)</TableHead>
                      <TableHead>Admission Status</TableHead>
                      <TableHead>Reward Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferrals.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="font-semibold text-foreground">{item.referrerName}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{item.referrerPhone}</div>
                          {item.referrerEmail && (
                            <div className="text-[10px] text-muted-foreground">{item.referrerEmail}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{item.refereeParentName}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Child: {item.refereeChildName}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            Tour: {format(parseISO(item.refereeDate), "PP")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={item.refereeStatus as any} />
                        </TableCell>
                        <TableCell>
                          <Badge className={`${REWARD_STATUS_COLORS[item.rewardStatus]} font-semibold tracking-wide border uppercase`}>
                            {item.rewardStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.rewardStatus === "eligible" ? (
                            <Button
                              size="sm"
                              className="rounded-full gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                              onClick={() => handleClaim(item.id)}
                            >
                              <Gift className="w-3.5 h-3.5" />
                              Mark Claimed
                            </Button>
                          ) : item.rewardStatus === "claimed" ? (
                            <div className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1 text-sm mr-4">
                              <Check className="w-4 h-4" />
                              Claimed
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground mr-4">Pending Admission</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <Gift className="w-12 h-12 text-muted-foreground/35 mx-auto mb-3" />
                <p className="font-semibold">No Referrals Found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Referrals will appear here once parents submit their bookings choosing "Friend/Family" referral.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
