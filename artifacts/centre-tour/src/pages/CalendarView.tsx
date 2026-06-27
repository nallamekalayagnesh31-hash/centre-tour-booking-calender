import { useState } from "react";
import { Link } from "wouter";
import { useGetCalendarSlots } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  parseISO, 
  getDay
} from "date-fns";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthKey = format(currentDate, "yyyy-MM");
  const { data: slots, isLoading } = useGetCalendarSlots({ month: monthKey });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Pad the start of the month with empty days so the 1st falls on the correct day of week
  const startDayOfWeek = getDay(monthStart);
  const paddingDays = Array.from({ length: startDayOfWeek }).map((_, i) => i);

  // Group slots by date
  const slotsByDate = slots?.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, typeof slots>);

  return (
    <div className="flex-1 p-6 md:p-8 bg-muted/20">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Tour Calendar</h1>
            <p className="text-muted-foreground mt-1">View scheduled tours and availability.</p>
          </div>
        </div>

        <Card className="shadow-sm">
          <div className="p-4 border-b flex items-center justify-between bg-card">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="h-[600px] flex items-center justify-center bg-card">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="bg-card">
                {/* Day Names Header */}
                <div className="grid grid-cols-7 border-b bg-muted/30">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 border-b border-l">
                  {paddingDays.map((_, i) => (
                    <div key={`pad-${i}`} className="min-h-[120px] bg-muted/10 border-r border-b" />
                  ))}
                  
                  {daysInMonth.map((day, idx) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const daySlots = slotsByDate?.[dateKey] || [];
                    const bookedSlots = daySlots.filter(s => s.isBooked);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    
                    return (
                      <div 
                        key={day.toString()} 
                        className={cn(
                          "min-h-[120px] border-r border-b p-2 transition-colors",
                          !isCurrentMonth && "bg-muted/10 text-muted-foreground",
                          isToday(day) && "bg-primary/5"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn(
                            "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full text-foreground",
                            isToday(day) && "bg-primary text-primary-foreground"
                          )}>
                            {format(day, "d")}
                          </span>
                          {bookedSlots.length > 0 && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                              {bookedSlots.length} tour{bookedSlots.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1.5 mt-2">
                          {bookedSlots.map((slot, i) => (
                            <HoverCard key={i}>
                              <HoverCardTrigger asChild>
                                <Link href={slot.bookingId ? `/admin/bookings/${slot.bookingId}` : "#"}>
                                  <div className="text-xs p-1.5 rounded bg-primary/10 text-foreground border border-primary/20 truncate cursor-pointer hover:bg-primary hover:text-white transition-colors">
                                     <span className="font-semibold text-primary mr-1">{slot.timeSlot}</span>
                                     {slot.parentName}
                                  </div>
                                </Link>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-64 z-50">
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold">{slot.parentName}</p>
                                  <p className="text-sm text-muted-foreground">Child: {slot.childName}</p>
                                  <div className="flex items-center text-xs text-muted-foreground pt-2 border-t">
                                    <CalendarIcon className="w-3 h-3 mr-1" />
                                    {format(parseISO(slot.date), "MMM d")} at {slot.timeSlot}
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
