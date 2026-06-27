import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetBooking, 
  useUpdateBookingStatus, 
  useAddNote, 
  getGetBookingQueryKey,
  useDeleteBooking
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Phone, Mail, Clock, Calendar, Baby, User, MapPin, Loader2, Send, MessageSquare, Sparkles, Copy, Check, FileText, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function BookingDetail({ id: propId }: { id?: number }) {
  const params = useParams<{ id: string }>();
  const id = propId ?? (params?.id ? parseInt(params.id, 10) : 0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [, setLocation] = useLocation();

  const { data: booking, isLoading } = useGetBooking(id, { query: { enabled: !!id, queryKey: getGetBookingQueryKey(id) }});
  
  const updateStatus = useUpdateBookingStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(id) });
        toast({ title: "Status updated successfully" });
        setIsUpdating(false);
      }
    }
  });

  const deleteBooking = useDeleteBooking({
    mutation: {
      onSuccess: () => {
        toast({ title: "Booking deleted successfully" });
        queryClient.invalidateQueries();
        setLocation("/staff/dashboard");
      },
      onError: (err: any) => {
        toast({
          title: "Delete Failed",
          description: err?.data?.error || err?.message || "Failed to delete booking",
          variant: "destructive",
        });
      }
    }
  });

  const addNote = useAddNote({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(id) });
        setNewNote("");
        toast({ title: "Note added successfully" });
      }
    }
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState("");
  const [counsellor, setCounsellor] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  
  const [newNote, setNewNote] = useState("");
  const [noteAuthor, setNoteAuthor] = useState("Admissions Team");

  // AI Assistant Configuration
  const [msgChannel, setMsgChannel] = useState<"whatsapp" | "email" | "sms">("whatsapp");
  const [copied, setCopied] = useState(false);
  // Redirect-based sending — no loading state needed, but kept for button UI
  const isSendingWhatsApp = false;
  const isSendingEmail = false;

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!booking) {
    return <div className="p-8 text-center">Booking not found.</div>;
  }

  const getAiHelperData = () => {
    const parent = booking.parentName || "Parent";
    const child = booking.childName || "Child";
    const program = booking.preferredClass || "Preschool";
    const date = booking.date ? format(parseISO(booking.date), "PPP") : "selected date";
    const time = booking.timeSlot || "selected time";
    const counsellorName = booking.assignedTo || "Admissions Team";

    switch (booking.status) {
      case "enquiry":
        return {
          nextAction: "Call the parent to schedule and confirm the campus tour.",
          reminders: [
            "✅ Initial email enquiry confirmation sent to parent",
            "⏰ Tour scheduled notification is pending tour booking"
          ],
          whatsapp: `Hi *${parent}*, thank you for your enquiry for *${child}* at FirstCry Intellitots. We would love to show you around our campus! We have a tour slot available on *${date}* at *${time}*. Would this time suit you? - ${counsellorName}, FirstCry Intellitots`,
          sms: `Hi ${parent}, thanks for inquiring about FirstCry Intellitots for ${child}. We have slot on ${date} at ${time} open. Please reply to confirm tour. - ${counsellorName}`,
          email: `Subject: School Tour Invitation - FirstCry Intellitots\n\nDear ${parent},\n\nThank you for your enquiry regarding admission for your child, ${child}, in our ${program} program.\n\nWe would love to invite you for a personal campus tour on ${date} at ${time} to meet our educators and see our learning space.\n\nPlease let us know if this time works for you.\n\nWarm regards,\n${counsellorName}\nFirstCry Intellitots Admissions`
        };
      case "tour_scheduled":
        return {
          nextAction: "Conduct the school tour. Walk them through classrooms, play area, and highlight safety features.",
          reminders: [
            "✅ Tour scheduled confirmation sent immediately",
            "⏰ Automated WhatsApp reminder scheduled 24 hours prior",
            "⏰ SMS reminder scheduled 2 hours prior to tour"
          ],
          whatsapp: `Hi *${parent}*, this is a reminder that you have a campus tour scheduled for *${child}* at FirstCry Intellitots on *${date}* at *${time}*. We look forward to meeting you! - ${counsellorName}`,
          sms: `Hi ${parent}, reminder for your tour at FirstCry Intellitots for ${child} on ${date} at ${time}. See you soon!`,
          email: `Subject: Reminder: School Tour at FirstCry Intellitots\n\nDear ${parent},\n\nThis is a quick reminder for your scheduled school tour for ${child} on ${date} at ${time}.\n\nIf you need directions or want to reschedule, feel free to reply to this email or call us directly.\n\nWe look forward to welcoming you!\n\nWarm regards,\n${counsellorName}\nFirstCry Intellitots`
        };
      case "demo":
        return {
          nextAction: "Schedule a demo class for the child. Follow up on how they enjoyed the learning session.",
          reminders: [
            "✅ Post-tour email sent with feedback form",
            "⏰ Demo class confirmation reminder pending schedule"
          ],
          whatsapp: `Hi *${parent}*, we hope you enjoyed the tour for *${child}*! We would love to invite *${child}* for a free 45-minute interactive demo class this week. It will help them experience our classrooms first-hand. Let us know if you'd like to schedule this! - ${counsellorName}`,
          sms: `Hi ${parent}, hope you liked the tour! We'd love to invite ${child} for a free demo class this week. Let us know if you are interested. - FirstCry Intellitots`,
          email: `Subject: Invite: Free Demo Class for ${child} at FirstCry Intellitots\n\nDear ${parent},\n\nIt was a pleasure meeting you and showing you around our campus.\n\nTo help you make the best decision for ${child}'s early education, we would like to invite them for a complimentary demo class. They will join our current class, participate in activities, and interact with teachers.\n\nPlease let us know if you would like to schedule this session.\n\nWarm regards,\n${counsellorName}\nFirstCry Intellitots`
        };
      case "follow_up":
        return {
          nextAction: "Call parent to address queries regarding curriculum, fees, or documents required.",
          reminders: [
            `⏰ Callback alert active for follow-up date: ${booking.followUpDate ? format(parseISO(booking.followUpDate), "PPP") : "Scheduled"}`,
            "✅ Initial fee structure brochure sent"
          ],
          whatsapp: `Hi *${parent}*, checking in to see if you have any questions regarding the admission process or fee structure we discussed for *${child}*. We currently have limited seats left for the *${program}* program. Let me know if you would like to secure the seat! - ${counsellorName}`,
          sms: `Hi ${parent}, checking in about ${child}'s admission. Seats are filling fast for ${program}. Let me know if you have any questions! - ${counsellorName}`,
          email: `Subject: Following up on ${child}'s admission - FirstCry Intellitots\n\nDear ${parent},\n\nI hope you are doing well.\n\nI wanted to follow up and see if you had any questions regarding the admission process, school timings, or the fee structure we discussed for ${child}.\n\nAs we are nearing the end of our batch strength for ${program}, please let us know if you would like to proceed with securing their seat.\n\nLooking forward to hearing from you.\n\nWarm regards,\n${counsellorName}\nFirstCry Intellitots`
        };
      case "admission_confirmed":
        return {
          nextAction: "Collect outstanding medical forms, emergency contacts, and confirm uniform size.",
          reminders: [
            "✅ Welcome kit sent via email immediately",
            "✅ Invoice copy sent to email",
            "⏰ Orientation schedule reminder set to send 7 days before class starts"
          ],
          whatsapp: `Hi *${parent}*, a warm welcome to the FirstCry Intellitots family! We are so excited to have *${child}* join us. Please share the uniform size preference, and we will send over the orientation details shortly. - ${counsellorName}`,
          sms: `Hi ${parent}, welcome to FirstCry Intellitots! We are thrilled to have ${child} join us. Please check your email for the welcome kit and orientation details.`,
          email: `Subject: Welcome to FirstCry Intellitots! 🎉\n\nDear ${parent},\n\nWe are absolutely thrilled to welcome you and ${child} to the FirstCry Intellitots family!\n\nYour admission is confirmed. Please find attached the Welcome Kit, which contains:\n1. Academic Calendar\n2. School Timings & Batch Details\n3. Medical & Emergency Contact forms (to be filled)\n\nPlease share the uniform size preference at your earliest convenience.\n\nWe look forward to an amazing learning journey together!\n\nWarm regards,\n${counsellorName}\nCentre Head / Admissions`
        };
      case "cancelled":
        return {
          nextAction: "Categorize as inactive. Keep in the mailing list for future events or open houses.",
          reminders: [
            "✅ Cancellation confirmation sent",
            "ℹ️ Automated reminders deactivated"
          ],
          whatsapp: `Hi *${parent}*, we are sorry to hear that you won't be able to visit us this time. We would love to keep you updated on our future open houses and events for *${child}*. Wishing you all the best! - ${counsellorName}`,
          sms: `Hi ${parent}, sorry to hear you cancelled the tour for ${child}. Wishing you all the best! - FirstCry Intellitots`,
          email: `Subject: Tour Cancellation Confirmation - FirstCry Intellitots\n\nDear ${parent},\n\nWe have cancelled your tour request as per your request.\n\nIf you ever decide to reschedule or have any questions in the future, please feel free to reach out to us.\n\nWe wish you and ${child} the very best.\n\nSincerely,\n${counsellorName}\nFirstCry Intellitots`
        };
      default:
        return {
          nextAction: "N/A",
          reminders: ["No active reminders"],
          whatsapp: "",
          sms: "",
          email: ""
        };
    }
  };

  const aiData = getAiHelperData();

  const handleCopy = () => {
    navigator.clipboard.writeText(aiData[msgChannel]);
    setCopied(true);
    toast({ title: "Template copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const message = aiData.whatsapp;
    if (!message.trim()) {
      toast({ title: "No WhatsApp template", description: "There is no WhatsApp message template for this status.", variant: "destructive" });
      return;
    }
    const phone = (booking.whatsapp || booking.phone || "").replace(/[^0-9]/g, "");
    // Encode the pre-filled message and open WhatsApp
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank", "noopener,noreferrer");
  };

  const handleSendEmail = () => {
    const message = aiData.email;
    if (!message || !message.trim()) {
      toast({ title: "No Email template", description: "There is no email message template for this status.", variant: "destructive" });
      return;
    }
    const toEmail = booking.email || "";
    // Parse subject from the template (first line starting with "Subject: ")
    const lines = message.split("\n");
    let subject = "Message from FirstCry Intellitots";
    let bodyLines = lines;
    if (lines[0]?.startsWith("Subject: ")) {
      subject = lines[0].replace("Subject: ", "").trim();
      // Skip blank line after subject
      bodyLines = lines.slice(lines[1]?.trim() === "" ? 2 : 1);
    }
    const body = bodyLines.join("\n");
    const mailtoUrl = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, "_self");
  };

  const handleUpdateStatus = () => {
    if (!newStatus) return;
    updateStatus.mutate({
      id,
      data: {
        status: newStatus as any,
        note: statusNote || undefined,
        assignedTo: counsellor || undefined,
        followUpDate: followUpDate || undefined,
      }
    });
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !noteAuthor.trim()) return;
    addNote.mutate({
      id,
      data: {
        content: newNote,
        author: noteAuthor,
      }
    });
  };

  const handlePrintPDF = () => {
    if (!booking) return;
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

    const formattedDate = booking.date ? format(parseISO(booking.date), "PPP") : "";
    const formattedCreatedAt = booking.createdAt ? format(parseISO(booking.createdAt), "PPP p") : "";
    const notesList = booking.notes && booking.notes.length > 0
      ? booking.notes.map((n: any) => `
        <div class="note-item" style="border-left: 3px solid #3b82f6; padding-left: 10px; margin-bottom: 12px;">
          <div class="note-meta" style="font-size: 11px; color: #6b7280;">
            <strong>${n.author || "Admissions Team"}</strong> - ${format(parseISO(n.createdAt), "PP p")}
          </div>
          <div class="note-content" style="font-size: 13px; color: #374151; margin-top: 2px;">${n.content}</div>
        </div>
      `).join("")
      : "<p style='color: #666; font-style: italic;'>No staff notes added yet.</p>";

    const historyList = booking.statusHistory && booking.statusHistory.length > 0
      ? booking.statusHistory.map((h: any) => `
        <div class="history-item" style="padding: 8px 0; border-bottom: 1px dashed #e5e7eb; font-size: 13px;">
          <span>Status changed to <strong>${getStatusLabel(h.toStatus)}</strong></span>
          <span style="color: #666; font-size: 11px;">by ${h.changedBy || "System"} on ${format(parseISO(h.changedAt), "PP p")}</span>
          ${h.note ? `<div class="history-note" style="font-style: italic; color: #4b5563; font-size: 12px; margin-top: 4px; padding-left: 8px; border-left: 2px solid #d1d5db;">"${h.note}"</div>` : ""}
        </div>
      `).join("")
      : "<p style='color: #666; font-style: italic;'>No status history available.</p>";

    printWindow.document.write(`
      <html>
        <head>
          <title>Booking Summary - ${booking.parentName || "Parent"}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #333; margin: 30px; line-height: 1.5; font-size: 14px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 25px; }
            .logo { font-size: 24px; font-weight: bold; color: #1e3a8a; }
            .status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; background-color: #dbeafe; color: #1e40af; }
            .status-admission_confirmed { background-color: #d1fae5; color: #065f46; }
            .status-cancelled { background-color: #fee2e2; color: #991b1b; }
            .status-follow_up { background-color: #fef3c7; color: #92400e; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 12px; color: #1e3a8a; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .field-label { font-size: 12px; color: #6b7280; font-weight: 500; }
            .field-value { font-size: 14px; font-weight: 600; color: #1f2937; margin-top: 2px; }
            @media print {
              body { margin: 15px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">FirstCry Intellitots</div>
              <h1 style="margin: 5px 0 0 0; font-size: 20px; color: #111827;">Booking Summary</h1>
              <span style="color: #6b7280; font-size: 12px;">Submitted: ${formattedCreatedAt}</span>
            </div>
            <div style="text-align: right;">
              <span class="status-badge status-${booking.status}">${getStatusLabel(booking.status)}</span>
              <div style="margin-top: 8px; font-size: 12px; color: #4b5563;"><strong>Booking ID:</strong> #${booking.id}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Parent & Child Details</div>
            <div class="grid">
              <div>
                <div class="field-label">PARENT NAME</div>
                <div class="field-value">${booking.parentName || ""}</div>
              </div>
              <div>
                <div class="field-label">CHILD NAME & AGE</div>
                <div class="field-value">${booking.childName || ""} (${booking.childAge || "Age N/A"})</div>
              </div>
              <div>
                <div class="field-label">PHONE NUMBER</div>
                <div class="field-value">${booking.phone || ""}</div>
              </div>
              <div>
                <div class="field-label">EMAIL ADDRESS</div>
                <div class="field-value">${booking.email || ""}</div>
              </div>
              <div>
                <div class="field-label">WHATSAPP</div>
                <div class="field-value">${booking.whatsapp || booking.phone || ""}</div>
              </div>
              <div>
                <div class="field-label">REFERRAL SOURCE</div>
                <div class="field-value">${booking.referralSource || "Direct / Online"}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Tour & Class Details</div>
            <div class="grid">
              <div>
                <div class="field-label">TOUR DATE</div>
                <div class="field-value">${formattedDate}</div>
              </div>
              <div>
                <div class="field-label">TIME SLOT</div>
                <div class="field-value">${booking.timeSlot || ""}</div>
              </div>
              <div>
                <div class="field-label">PREFERRED PROGRAM</div>
                <div class="field-value">${booking.preferredClass || "Preschool"}</div>
              </div>
              <div>
                <div class="field-label">ASSIGNED COUNSELLOR</div>
                <div class="field-value">${booking.assignedTo || "Unassigned"}</div>
              </div>
            </div>
          </div>

          ${booking.message ? `
          <div class="section">
            <div class="section-title">Parent's Message</div>
            <div style="background-color: #f9fafb; padding: 12px; border-radius: 6px; font-style: italic; color: #4b5563;">
              "${booking.message}"
            </div>
          </div>
          ` : ""}

          <div class="section" style="page-break-inside: avoid;">
            <div class="section-title">Staff Notes</div>
            ${notesList}
          </div>

          <div class="section" style="page-break-inside: avoid;">
            <div class="section-title">Admissions Status Timeline</div>
            ${historyList}
          </div>

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

  return (
    <div className="flex-1 p-6 md:p-8 bg-muted/20">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/staff/dashboard">
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                {booking.parentName}
                <StatusBadge status={booking.status} />
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Requested on {format(parseISO(booking.createdAt), "PPP")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handlePrintPDF} variant="outline" className="gap-2">
                <FileText className="w-4 h-4" />
                Print / PDF
              </Button>
              <Button onClick={() => setIsUpdating(!isUpdating)} variant={isUpdating ? "outline" : "default"}>
                {isUpdating ? "Cancel Update" : "Update Status"}
              </Button>
              <Button 
                onClick={() => setShowDeleteConfirm(true)} 
                variant="outline" 
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Booking
              </Button>
            </div>
          </div>
        </div>

        {/* Update Status Form Panel */}
        {isUpdating && (
          <Card className="border-primary/50 shadow-md">
            <CardHeader className="pb-4 bg-primary/5 rounded-t-lg">
              <CardTitle className="text-lg">Update Booking Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">New Status</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enquiry">Enquiry</SelectItem>
                        <SelectItem value="tour_scheduled">Tour Scheduled</SelectItem>
                        <SelectItem value="demo">Demo</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                        <SelectItem value="admission_confirmed">Admission Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Assign Counsellor (Optional)</label>
                    <Input 
                      placeholder="e.g. Sarah Jenkins" 
                      value={counsellor} 
                      onChange={(e) => setCounsellor(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Next Follow-up Date (Optional)</label>
                    <Input 
                      type="date"
                      value={followUpDate} 
                      onChange={(e) => setFollowUpDate(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Status Change Note (Optional)</label>
                    <Textarea 
                      placeholder="Reason for change..." 
                      className="resize-none h-24"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleUpdateStatus} disabled={!newStatus || updateStatus.isPending}>
                      {updateStatus.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Details Column */}
          <div className="lg:col-span-2 space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-muted-foreground" /> 
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Phone
                  </p>
                  <p className="font-medium text-foreground">{booking.phone}</p>
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </p>
                  <p className="font-medium text-foreground break-all">{booking.email}</p>
                </div>
                <div className="space-y-2 flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp
                    </p>
                    <p className="font-medium text-foreground">{booking.whatsapp || booking.phone}</p>
                  </div>
                  <a
                    href={`https://wa.me/${(booking.whatsapp || booking.phone).replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-colors w-fit"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 2.023 14.12 1 11.49 1a9.86 9.86 0 0 0-9.855 9.802c-.002 1.703.454 3.366 1.323 4.878l-.99 3.618 3.734-.967c1.478.784 2.923 1.189 4.355 1.189zm7.366-10.733c-.167-.25-.436-.375-.761-.5-.328-.125-1.285-.5-1.477-.563-.191-.062-.328-.094-.467.094-.139.188-.538.563-.661.688-.121.125-.246.125-.574-.062-.328-.188-1.385-.509-2.637-1.613-.974-.863-1.632-1.928-1.823-2.25-.191-.328-.021-.5-.184-.663-.148-.148-.328-.375-.492-.563-.163-.188-.218-.312-.328-.5-.11-.188-.056-.344-.028-.469.028-.125.139-.313.139-.313s.111-.188.167-.313c.056-.125.028-.25-.014-.375-.042-.125-.467-1.125-.639-1.531-.167-.406-.339-.344-.467-.344-.121 0-.263-.031-.406-.031-.143 0-.371.047-.567.25-.195.203-.746.719-.746 1.75 0 1.031.761 2.031.867 2.156.106.125 1.5 2.281 3.633 3.203 1.25.541 1.781.597 2.406.5.625-.097 1.285-.5 1.477-.969.191-.469.191-.875.133-.969z"/>
                    </svg>
                    Chat on WhatsApp
                  </a>
                </div>
              </CardContent>
              <Separator />
              <CardHeader className="pt-6">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Baby className="w-5 h-5 text-muted-foreground" />
                  Child & Program Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium text-foreground">{booking.childName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Age Group</p>
                  <p className="font-medium text-foreground">{booking.childAge}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Program of Interest</p>
                  <p className="font-medium text-foreground">{booking.preferredClass || "Not specified"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Referral Source</p>
                  <p className="font-medium text-foreground">{booking.referralSource || "Not specified"}</p>
                </div>
              </CardContent>
              <Separator />
              <CardHeader className="pt-6">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  Tour Schedule & Follow-up
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Date
                  </p>
                  <p className="font-medium text-foreground">{format(parseISO(booking.date), "EEEE, MMMM do, yyyy")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Time
                  </p>
                  <p className="font-medium text-foreground">{booking.timeSlot}</p>
                </div>
                {booking.followUpDate && (
                  <div className="space-y-1 sm:col-span-2 bg-yellow-50/50 border border-yellow-200 rounded-lg p-3 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-yellow-800 font-semibold uppercase tracking-wider">Next Follow-up Scheduled</p>
                      <p className="text-sm text-yellow-900 font-semibold">
                        {(() => {
                          try {
                            const parsed = parseISO(booking.followUpDate);
                            if (!isNaN(parsed.getTime())) {
                              return format(parsed, "EEEE, MMMM do, yyyy");
                            }
                          } catch (e) {}
                          return booking.followUpDate;
                        })()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
              
              {booking.message && (
                <>
                  <Separator />
                  <CardContent className="pt-6">
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <p className="text-sm font-medium text-foreground mb-2">Parent's Message:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{booking.message}</p>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {booking.notes && booking.notes.length > 0 ? (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      {booking.notes.map((note) => (
                        <div key={note.id} className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                          <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{note.author}</span>
                            <span>{format(parseISO(note.createdAt), "MMM d, h:mm a")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">No notes added yet.</p>
                  )}
                  
                  <Separator className="my-4" />
                  
                  <div className="flex flex-col gap-3">
                    <Input 
                      placeholder="Your Name (Author)" 
                      value={noteAuthor} 
                      onChange={(e) => setNoteAuthor(e.target.value)} 
                      className="w-full sm:w-64"
                    />
                    <div className="relative">
                      <Textarea 
                        placeholder="Type a new note..." 
                        className="resize-none pr-12 pb-10" 
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddNote();
                          }
                        }}
                      />
                      <Button 
                        size="icon" 
                        className="absolute bottom-2 right-2 rounded-full h-8 w-8"
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || !noteAuthor.trim() || addNote.isPending}
                      >
                        {addNote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Timeline Column */}
          <div className="space-y-6">
            {/* AI Admissions Assistant Card */}
            <Card className="border-primary/30 shadow-sm relative overflow-hidden bg-white">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
              <CardHeader className="pb-3 border-b bg-primary/5">
                <CardTitle className="text-base flex items-center gap-2 font-bold text-primary">
                  <Sparkles className="w-5 h-5 animate-pulse text-primary" />
                  AI Admissions Assistant
                </CardTitle>
                <CardDescription className="text-xs">
                  Next actions and customized follow-up templates.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Next Action */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suggested Next Action</p>
                  <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg text-xs leading-relaxed text-foreground font-semibold">
                    {aiData.nextAction}
                  </div>
                </div>

                {/* Follow-up Message Templates */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Follow-up Message</p>
                    <div className="flex gap-1 bg-muted p-0.5 rounded-lg border">
                      {(["whatsapp", "email", "sms"] as const).map((channel) => (
                        <button
                          key={channel}
                          onClick={() => setMsgChannel(channel)}
                          className={cn(
                            "text-[10px] px-2 py-1 rounded-md font-semibold capitalize transition-all",
                            msgChannel === channel
                              ? "bg-white text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {channel}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <pre className="text-xs p-3 bg-muted/60 border rounded-xl overflow-x-auto whitespace-pre-wrap font-sans leading-relaxed min-h-[80px] max-h-[160px] overflow-y-auto">
                      {aiData[msgChannel]}
                    </pre>
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 bg-white/80 hover:bg-white border rounded-md"
                        onClick={handleCopy}
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Send Notifications */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full text-xs font-semibold h-9 rounded-lg border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-700 hover:text-emerald-800 disabled:opacity-60"
                    onClick={handleSendWhatsApp}
                    disabled={isSendingWhatsApp || !aiData.whatsapp}
                  >
                    {isSendingWhatsApp
                      ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      : <MessageSquare className="w-3.5 h-3.5 mr-1 text-emerald-500" />}
                    {isSendingWhatsApp ? "Sending…" : "Send WhatsApp"}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full text-xs font-semibold h-9 rounded-lg border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-700 hover:text-blue-800 disabled:opacity-60"
                    onClick={handleSendEmail}
                    disabled={isSendingEmail || !aiData.email}
                  >
                    {isSendingEmail ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5 mr-1 text-blue-500" />
                    )}
                    {isSendingEmail ? "Sending…" : "Send Email"}
                  </Button>
                </div>

                {/* Auto Reminders Status */}
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Auto Reminders Status</p>
                  <div className="space-y-1.5 pl-1">
                    {aiData.reminders.map((reminder, idx) => (
                      <div key={idx} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/70 flex-shrink-0" />
                        <span>{reminder}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Timeline</CardTitle>
                <CardDescription>Status changes and history</CardDescription>
              </CardHeader>
              <CardContent>
                {booking.statusHistory && booking.statusHistory.length > 0 ? (
                  <div className="relative border-l-2 border-muted ml-3 space-y-6 pb-4">
                    {booking.statusHistory.map((history, idx) => (
                      <div key={history.id} className="relative pl-6">
                        <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1 border-2 border-white" />
                        <p className="text-xs text-muted-foreground mb-1">
                          {format(parseISO(history.changedAt), "MMM d, h:mm a")}
                        </p>
                        <div className="text-sm text-foreground mb-1">
                          <span className="font-medium">{history.changedBy}</span> changed status to <span className="font-medium">{history.toStatus.replace("_", " ")}</span>
                        </div>
                        {history.note && (
                          <div className="text-xs bg-muted p-2 rounded mt-2 text-muted-foreground italic">
                            "{history.note}"
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Creation step */}
                    <div className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-muted-foreground rounded-full -left-[7px] top-1 border-2 border-white" />
                      <p className="text-xs text-muted-foreground mb-1">
                        {format(parseISO(booking.createdAt), "MMM d, h:mm a")}
                      </p>
                      <p className="text-sm text-foreground">
                        Enquiry received
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">No history available.</p>
                )}
              </CardContent>
            </Card>
        </div>
      </div>
    </div>

      {/* Delete Booking Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Booking
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the booking for <strong>{booking.parentName}</strong>? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteBooking.isPending}
              onClick={() => {
                deleteBooking.mutate({ id });
              }}
            >
              {deleteBooking.isPending ? "Deleting..." : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
