import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateBooking, useGetCalendarSlots } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckCircle2, Loader2, PartyPopper } from "lucide-react";
import { format, isBefore, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const bookingSchema = z.object({
  parentName: z.string().min(2, "Parent name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Invalid email address"),
  childName: z.string().min(2, "Child name is required"),
  childAge: z.string().min(1, "Please select child's age"),
  preferredClass: z.string().min(1, "Please select a program of interest"),
  referralSource: z.string().optional(),
  referredByName: z.string().optional(),
  referredByPhone: z.string().optional(),
  referredByEmail: z.string().optional(),
  date: z.date({
    required_error: "Please select a date",
  }),
  timeSlot: z.string().min(1, "Please select a time slot"),
  message: z.string().optional(),
  whatsapp: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.referralSource === "Friend/Family") {
    if (!val.referredByName || val.referredByName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Referring parent's name is required",
        path: ["referredByName"],
      });
    }
    if (!val.referredByPhone || val.referredByPhone.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Valid phone number is required for the referring parent",
        path: ["referredByPhone"],
      });
    }
  }
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export function BookTour() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<BookingFormValues | null>(null);
  const [isWhatsAppSame, setIsWhatsAppSame] = useState(true);
  const { toast } = useToast();

  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      parentName: "",
      phone: "",
      email: "",
      childName: "",
      childAge: "",
      preferredClass: "",
      referralSource: "",
      referredByName: "",
      referredByPhone: "",
      referredByEmail: "",
      timeSlot: "",
      message: "",
      whatsapp: "",
    },
  });

  const selectedDate = form.watch("date");
  const referralSource = form.watch("referralSource");
  const monthKey = format(calendarMonth, "yyyy-MM");
  
  const { data: slots } = useGetCalendarSlots({ month: monthKey });

  const TIME_SLOTS = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
  ];

  const isDateFullyBooked = (date: Date) => {
    // Weekends (Saturday/Sunday) are disabled
    const day = date.getDay();
    if (day === 0 || day === 6) return true;

    if (!slots) return false;
    const dateStr = format(date, "yyyy-MM-dd");
    const slotsOnDate = slots.filter((s) => s.date === dateStr);
    if (slotsOnDate.length === 0) return false;
    const bookedCount = slotsOnDate.filter((s) => s.isBooked).length;
    return bookedCount >= 6; // 6 slots total
  };

  const getSlotStatus = (slot: string) => {
    if (!selectedDate || !slots) return { isBooked: false, label: "10 slots available" };
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const slotInfo = slots.find((s) => s.date === dateStr && s.timeSlot === slot);
    
    if (!slotInfo) {
      return { isBooked: false, label: "10 slots available" };
    }
    
    const count = slotInfo.bookingsCount ?? 0;
    const available = Math.max(0, 10 - count);
    
    return {
      isBooked: count >= 10,
      label: count >= 10 ? "Fully Booked" : `${available} slot${available > 1 ? "s" : ""} available`,
    };
  };

  const createBooking = useCreateBooking({
    mutation: {
      onSuccess: () => {
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      onError: (err: any) => {
        const errMsg = err?.data?.error || err?.message || "Failed to book tour. Please try another slot.";
        toast({
          title: "Booking Failed",
          description: errMsg,
          variant: "destructive",
        });
      }
    }
  });

  const onSubmit = (data: BookingFormValues) => {
    setSubmittedData(data);
    createBooking.mutate({
      data: {
        parentName: data.parentName,
        phone: data.phone,
        email: data.email,
        childName: data.childName,
        childAge: data.childAge,
        date: format(data.date, "yyyy-MM-dd"),
        timeSlot: data.timeSlot,
        message: data.message,
        whatsapp: isWhatsAppSame ? data.phone : (data.whatsapp || data.phone),
        preferredClass: data.preferredClass,
        referralSource: data.referralSource || undefined,
        referredByName: data.referralSource === "Friend/Family" ? data.referredByName : undefined,
        referredByPhone: data.referralSource === "Friend/Family" ? data.referredByPhone : undefined,
        referredByEmail: data.referralSource === "Friend/Family" ? (data.referredByEmail || undefined) : undefined,
      }
    });
  };

  if (isSuccess && submittedData) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-black/35 backdrop-blur-md rounded-2xl shadow-xl border border-white/10 p-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">Tour Requested!</h2>
          <p className="text-muted-foreground mb-8">
            Thank you, {submittedData.parentName}. We have received your request for a school tour for {submittedData.childName}.
          </p>
          
          <div className="bg-secondary/50 rounded-xl p-6 text-left mb-8 space-y-4">
            <div className="flex items-start gap-3">
              <CalendarIcon className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">
                  {format(submittedData.date, "EEEE, MMMM do, yyyy")}
                </p>
                <p className="text-sm text-muted-foreground">{submittedData.timeSlot}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Next Steps</p>
                <p className="text-sm text-muted-foreground">Our admissions counsellor will contact you shortly to confirm the appointment.</p>
              </div>
            </div>
          </div>
          
          <Button onClick={() => window.location.href = "/"} className="w-full rounded-full">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-12 px-4 bg-transparent">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-4">Book a School Tour</h1>
          <p className="text-lg text-muted-foreground">
            Come see our vibrant classrooms and meet our dedicated educators.
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="p-6 md:p-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Parent Details */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-foreground border-b pb-2">Parent Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="parentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" type="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex flex-col gap-3 md:col-span-2">
                      <div className="flex items-center space-x-2 py-1">
                        <Checkbox 
                          id="whatsappSame" 
                          checked={isWhatsAppSame} 
                          onCheckedChange={(checked) => setIsWhatsAppSame(!!checked)}
                        />
                        <label
                          htmlFor="whatsappSame"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Phone number is also my WhatsApp number
                        </label>
                      </div>
                      
                      {!isWhatsAppSame && (
                        <FormField
                          control={form.control}
                          name="whatsapp"
                          render={({ field }) => (
                            <FormItem className="animate-in fade-in slide-in-from-top-1 duration-200">
                              <FormLabel>WhatsApp Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter WhatsApp number (e.g. +91 98765 43210)" type="tel" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="jane@example.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Child Details */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-foreground border-b pb-2">Child Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="childName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Child's Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Leo Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="childAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Child's Age</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select age group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1.5-2 yrs">1.5 - 2 Years</SelectItem>
                              <SelectItem value="2-3 yrs">2 - 3 Years</SelectItem>
                              <SelectItem value="3-4 yrs">3 - 4 Years</SelectItem>
                              <SelectItem value="4-5 yrs">4 - 5 Years</SelectItem>
                              <SelectItem value="5-6 yrs">5 - 6 Years</SelectItem>
                              <SelectItem value="6-7 yrs">6 - 7 Years</SelectItem>
                              <SelectItem value="7-8 yrs">7 - 8 Years</SelectItem>
                              <SelectItem value="8-9 yrs">8 - 9 Years</SelectItem>
                              <SelectItem value="9-10 yrs">9 - 10 Years</SelectItem>
                              <SelectItem value="10-11 yrs">10 - 11 Years</SelectItem>
                              <SelectItem value="11-12 yrs">11 - 12 Years</SelectItem>
                              <SelectItem value="12-13 yrs">12 - 13 Years</SelectItem>
                              <SelectItem value="13-14 yrs">13 - 14 Years</SelectItem>
                              <SelectItem value="14-15 yrs">14 - 15 Years</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferredClass"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Program of Interest</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select program" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Playgroup">Playgroup</SelectItem>
                              <SelectItem value="Nursery">Nursery</SelectItem>
                              <SelectItem value="LKG">LKG</SelectItem>
                              <SelectItem value="UKG">UKG</SelectItem>
                              <SelectItem value="1st Class">1st Class</SelectItem>
                              <SelectItem value="2nd Class">2nd Class</SelectItem>
                              <SelectItem value="3rd Class">3rd Class</SelectItem>
                              <SelectItem value="4th Class">4th Class</SelectItem>
                              <SelectItem value="5th Class">5th Class</SelectItem>
                              <SelectItem value="6th Class">6th Class</SelectItem>
                              <SelectItem value="7th Class">7th Class</SelectItem>
                              <SelectItem value="8th Class">8th Class</SelectItem>
                              <SelectItem value="9th Class">9th Class</SelectItem>
                              <SelectItem value="10th Class">10th Class</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="referralSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How did you hear about us?</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Google Search">Google Search</SelectItem>
                              <SelectItem value="Social Media">Social Media</SelectItem>
                              <SelectItem value="Friend/Family">Friend/Family</SelectItem>
                              <SelectItem value="Flyer/Banner">Flyer/Banner</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {referralSource === "Friend/Family" && (
                      <div className="md:col-span-2 p-6 rounded-xl border border-border/50 bg-secondary/20 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <h4 className="text-sm font-semibold text-foreground/80 tracking-wide uppercase">Referred by Friend/Family</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="referredByName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Referring Parent's Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter parent's name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="referredByPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Referring Parent's Phone *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter parent's phone number" type="tel" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="referredByEmail"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Referring Parent's Email (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="parent@example.com" type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tour Preferences */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-foreground border-b pb-2">Tour Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Preferred Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(d) => {
                                  field.onChange(d);
                                  if (d) setCalendarMonth(d);
                                }}
                                onMonthChange={setCalendarMonth}
                                disabled={(date) => isBefore(date, startOfToday()) || isDateFullyBooked(date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="timeSlot"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Time Slot</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={!selectedDate}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={selectedDate ? "Select a time" : "Please pick a date first"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIME_SLOTS.map((slot) => {
                                const { isBooked, label } = getSlotStatus(slot);
                                return (
                                  <SelectItem key={slot} value={slot} disabled={isBooked}>
                                    <div className="flex justify-between items-center w-full gap-6">
                                      <span>{slot}</span>
                                      <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                        isBooked 
                                          ? "bg-red-50 text-red-600 border border-red-100" 
                                          : "bg-green-50 text-green-700 border border-green-100"
                                      )}>
                                        {label}
                                      </span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Questions or Comments (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any specific questions before the tour?" 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="rounded-full w-full md:w-auto min-w-[200px]"
                    disabled={createBooking.isPending}
                  >
                    {createBooking.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Request Tour"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
