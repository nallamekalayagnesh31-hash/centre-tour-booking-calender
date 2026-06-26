import { useState } from "react";
import { Link } from "wouter";
import { useListBookings, useGetBooking, getListBookingsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ShieldCheck, 
  Heart, 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  Search, 
  Loader2, 
  Info, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  MessageSquare, 
  Phone, 
  Mail 
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { StatusBadge } from "@/components/StatusBadge";

function BookingDetailsExpanded({ id }: { id: number }) {
  const { data: booking, isLoading, error } = useGetBooking(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 pt-4 border-t border-border/60">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">Loading booking history...</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="text-sm text-destructive py-2 pt-4 border-t border-border/60">
        Failed to load booking history. Please try again.
      </div>
    );
  }

  return (
    <div className="pt-4 border-t border-border/60 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-muted/30 p-3 rounded-lg border border-border/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="w-4 h-4 text-primary/70" />
          <span className="font-medium text-foreground">{booking.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="w-4 h-4 text-primary/70" />
          <span className="font-medium text-foreground">{booking.email}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageSquare className="w-4 h-4 text-emerald-500" />
          <span className="font-medium text-foreground">WhatsApp: {booking.whatsapp || booking.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4 text-primary/70" />
          <span>Submitted: {format(parseISO(booking.createdAt), "PPP")}</span>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-2">
        <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-primary" />
          Tracking Status Updates
        </h5>
        
        {booking.statusHistory && booking.statusHistory.length > 0 ? (
          <div className="relative border-l border-border/80 ml-2 pl-4 space-y-3 pt-1 pb-1">
            {booking.statusHistory.map((history) => (
              <div key={history.id} className="relative text-xs">
                {/* Timeline Dot */}
                <div className="absolute w-2.5 h-2.5 bg-primary rounded-full -left-[21.5px] top-1 border border-background" />
                <div className="flex items-center justify-between text-muted-foreground mb-0.5">
                  <span className="font-semibold text-foreground/80">
                    Status: {history.toStatus.replace("_", " ")}
                  </span>
                  <span>{format(parseISO(history.changedAt), "MMM d, yyyy h:mm a")}</span>
                </div>
                {history.note && (
                  <p className="text-muted-foreground/90 italic bg-muted/20 p-2 rounded border border-border/30 mt-1">
                    "{history.note}"
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic pl-2">No updates recorded yet.</p>
        )}
      </div>

      {/* Counselor Notes */}
      {booking.notes && booking.notes.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/40">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-primary" />
            Admissions Officer Notes
          </h5>
          <div className="space-y-2 pl-2">
            {booking.notes.map((note) => (
              <div key={note.id} className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-xs space-y-1">
                <p className="text-foreground/90 leading-relaxed font-medium">{note.content}</p>
                <div className="flex justify-between text-muted-foreground/80 text-[10px]">
                  <span>By {note.author}</span>
                  <span>{format(parseISO(note.createdAt), "MMM d, h:mm a")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Assistance Button */}
      <div className="pt-3 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/40 p-3 rounded-lg border border-emerald-500/10">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            WhatsApp Admissions Helpline
          </p>
          <p className="text-[11px] text-muted-foreground">
            Need adjustments or have questions? Chat directly with our centre team.
          </p>
        </div>
        <a 
          href={`https://wa.me/919876543210?text=Hello,%20I%20have%20an%20active%20tour%20booking%20(Ref:%20%23${booking.id})%20for%20my%20child%20${booking.childName}%20and%20wanted%20to%20discuss%20it.`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-colors w-full sm:w-auto justify-center"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 2.023 14.12 1 11.49 1a9.86 9.86 0 0 0-9.855 9.802c-.002 1.703.454 3.366 1.323 4.878l-.99 3.618 3.734-.967c1.478.784 2.923 1.189 4.355 1.189zm7.366-10.733c-.167-.25-.436-.375-.761-.5-.328-.125-1.285-.5-1.477-.563-.191-.062-.328-.094-.467.094-.139.188-.538.563-.661.688-.121.125-.246.125-.574-.062-.328-.188-1.385-.509-2.637-1.613-.974-.863-1.632-1.928-1.823-2.25-.191-.328-.021-.5-.184-.663-.148-.148-.328-.375-.492-.563-.163-.188-.218-.312-.328-.5-.11-.188-.056-.344-.028-.469.028-.125.139-.313.139-.313s.111-.188.167-.313c.056-.125.028-.25-.014-.375-.042-.125-.467-1.125-.639-1.531-.167-.406-.339-.344-.467-.344-.121 0-.263-.031-.406-.031-.143 0-.371.047-.567.25-.195.203-.746.719-.746 1.75 0 1.031.761 2.031.867 2.156.106.125 1.5 2.281 3.633 3.203 1.25.541 1.781.597 2.406.5.625-.097 1.285-.5 1.477-.969.191-.469.191-.875.133-.969z"/>
          </svg>
          Chat with Admissions
        </a>
      </div>
    </div>
  );
}

export function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [isSearched, setIsSearched] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<number | null>(null);

  // Determine if searching by email or phone
  const isEmail = submittedQuery.includes("@");
  const queryParams = submittedQuery
    ? isEmail
      ? { email: submittedQuery }
      : { phone: submittedQuery }
    : null;

  const { data: bookings, isLoading } = useListBookings(
    queryParams || {},
    { 
      query: { 
        enabled: !!submittedQuery,
        queryKey: getListBookingsQueryKey(queryParams || {})
      } 
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSubmittedQuery(searchQuery.trim());
    setIsSearched(true);
    setExpandedBookingId(null); // Reset expanded state on new search
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-transparent">
      <div className="dynamic-bg absolute inset-0 -z-20 pointer-events-none" />
      {/* Playful Floating Glow Blobs */}
      <div className="absolute top-[5%] left-[-15%] w-[50vw] h-[50vw] max-w-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-[15%] right-[-15%] w-[45vw] h-[45vw] max-w-[500px] rounded-full bg-accent/25 blur-[130px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '12s' }} />
      <div className="absolute top-[45%] left-[10%] w-[40vw] h-[40vw] max-w-[450px] rounded-full bg-primary/15 blur-[120px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '14s' }} />
      <div className="absolute bottom-[20%] right-[-5%] w-[50vw] h-[50vw] max-w-[550px] rounded-full bg-accent/20 blur-[130px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute bottom-[5%] left-[-10%] w-[45vw] h-[45vw] max-w-[500px] rounded-full bg-primary/25 blur-[110px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '9s' }} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-20">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary font-medium mb-8">
              <Sparkles className="w-4 h-4 mr-2" /> Welcome to FirstCry Intellitots
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              Where little minds <br />
              <span className="text-primary">blossom & grow.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              A safe, nurturing, and joyful environment designed to give your child the perfect start to their educational journey.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/book">
                <Button size="lg" className="rounded-full text-lg h-14 px-8 shadow-lg shadow-primary/25 w-full sm:w-auto">
                  Book a School Tour
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/staff/login">
                <Button variant="outline" size="lg" className="rounded-full text-lg h-14 px-8 w-full sm:w-auto hover:bg-accent/10">
                  Staff Portal
                </Button>
              </Link>
            </div>
          </div>
        </section>
 
        {/* Check Booking Status Section */}
        <section className="pb-24 pt-4">
          <div className="container mx-auto px-4 max-w-3xl">
            <Card className="border border-border/60 shadow-xl bg-card/60 backdrop-blur-md">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                  <Search className="w-6 h-6 text-primary" />
                  Check Tour Booking Status
                </CardTitle>
                <CardDescription>
                  Enter the email address or phone number you used during booking to track your enquiry.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Enter email or phone number"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12 text-base px-4 rounded-xl border-border focus-visible:ring-primary"
                    />
                  </div>
                  <Button type="submit" size="lg" className="h-12 px-6 rounded-xl text-base shadow-sm">
                    Find Bookings
                  </Button>
                </form>

                {isLoading && (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}

                {isSearched && !isLoading && bookings && bookings.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="font-semibold text-foreground text-lg mb-3">Your Bookings ({bookings.length})</h3>
                    <div className="grid gap-4">
                      {bookings.map((b) => (
                        <div key={b.id} className="border border-border/80 rounded-xl p-5 bg-muted/10 space-y-4 hover:border-primary/30 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-lg text-foreground">{b.childName}</h4>
                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Ref: #{b.id}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Age: {b.childAge} • Parent: {b.parentName}</p>
                            </div>
                            <div>
                              <StatusBadge status={b.status} />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-2 border-t border-border/40">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4 text-primary" />
                              <span>
                                {format(parseISO(b.date), "MMMM d, yyyy")} at {b.timeSlot}
                              </span>
                            </div>
                            {b.assignedTo && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Users className="w-4 h-4 text-primary" />
                                <span>Counsellor: {b.assignedTo}</span>
                              </div>
                            )}
                          </div>

                          {b.message && (
                            <div className="bg-muted/30 p-3 rounded-lg text-xs text-muted-foreground flex gap-2">
                              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                              <span><strong>Message:</strong> {b.message}</span>
                            </div>
                          )}

                          <div className="pt-2 flex justify-between items-center border-t border-border/20">
                            <span className="text-[11px] text-muted-foreground">
                              Click "View Details" to see status logs & counsellor notes
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary hover:bg-primary/5 text-xs font-semibold rounded-lg flex items-center gap-1 px-3 py-1.5 h-auto"
                              onClick={() => setExpandedBookingId(expandedBookingId === b.id ? null : b.id)}
                            >
                              {expandedBookingId === b.id ? (
                                <>
                                  Hide Details <ChevronUp className="w-3.5 h-3.5" />
                                </>
                              ) : (
                                <>
                                  View Details <ChevronDown className="w-3.5 h-3.5" />
                                </>
                              )}
                            </Button>
                          </div>

                          {expandedBookingId === b.id && (
                            <BookingDetailsExpanded id={b.id} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isSearched && !isLoading && bookings && bookings.length === 0 && (
                  <div className="text-center py-10 border-t border-border text-muted-foreground bg-muted/10 rounded-xl p-4">
                    <p className="font-medium">No bookings found</p>
                    <p className="text-sm mt-1">Please verify that you typed the correct email address or phone number.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features/Trust Section */}
        <section className="py-24 bg-transparent">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground">Why parents choose us</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="border border-teal-500/20 shadow-md bg-teal-950/20 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardContent className="pt-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Safe & Secure</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Child-friendly infrastructure with 24/7 CCTV surveillance and stringent safety protocols.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-orange-500/20 shadow-md bg-orange-950/20 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardContent className="pt-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-6">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Expert Care</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Trained early childhood educators who provide warm, individualized attention to every child.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-purple-500/20 shadow-md bg-purple-950/20 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardContent className="pt-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Joyful Learning</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Play-based curriculum designed to foster cognitive, social, and emotional development.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="bg-foreground text-background/80 py-12 text-center">
        <p className="opacity-60 text-sm">
          © {new Date().getFullYear()} FirstCry Intellitots. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
