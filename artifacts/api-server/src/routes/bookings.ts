import { Router } from "express";
import { db } from "@workspace/db";
import {
  bookingsTable,
  statusHistoryTable,
  notesTable,
  bookingStatusEnum,
  type BookingStatus,
  referralRewardsTable,
} from "@workspace/db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import {
  CreateBookingBody,
  UpdateBookingStatusBody,
  AddNoteBody,
  ListBookingsQueryParams,
  GetCalendarSlotsQueryParams,
} from "@workspace/api-zod";
import { sendWhatsAppMessage } from "../lib/whatsapp";
import { sendEmailMessage } from "../lib/email";


const router = Router();

const TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];

function formatBooking(b: typeof bookingsTable.$inferSelect) {
  return {
    id: b.id,
    parentName: b.parentName,
    phone: b.phone,
    email: b.email,
    childName: b.childName,
    childAge: b.childAge,
    date: b.date,
    timeSlot: b.timeSlot,
    status: b.status,
    assignedTo: b.assignedTo,
    message: b.message,
    whatsapp: b.whatsapp,
    preferredClass: b.preferredClass,
    referralSource: b.referralSource,
    followUpDate: b.followUpDate,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

// GET /bookings
router.get("/bookings", async (req, res) => {
  const parseResult = ListBookingsQueryParams.safeParse(req.query);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { status, date, counsellor, phone, email } = parseResult.data;

  const conditions = [];
  if (status) conditions.push(eq(bookingsTable.status, status));
  if (date) conditions.push(eq(bookingsTable.date, date));
  if (counsellor) conditions.push(eq(bookingsTable.assignedTo, counsellor));
  if (phone) conditions.push(eq(bookingsTable.phone, phone));
  if (email) conditions.push(eq(bookingsTable.email, email));

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bookingsTable.createdAt));

  res.json(bookings.map(formatBooking));
});

// POST /bookings and /create-booking (Alias)
router.post(["/bookings", "/create-booking"], async (req, res) => {
  const parseResult = CreateBookingBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid booking data" });
    return;
  }

  const data = parseResult.data;

  // Check for capacity limit (max 10 bookings per slot)
  const existing = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.date, data.date),
        eq(bookingsTable.timeSlot, data.timeSlot),
        sql`${bookingsTable.status} != 'cancelled'`
      )
    );

  if (existing.length >= 10) {
    res.status(409).json({ error: "This time slot is fully booked. Please choose a different slot." });
    return;
  }

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      parentName: data.parentName,
      phone: data.phone,
      email: data.email,
      childName: data.childName,
      childAge: data.childAge,
      date: data.date,
      timeSlot: data.timeSlot,
      message: data.message ?? null,
      whatsapp: data.whatsapp ?? null,
      preferredClass: data.preferredClass ?? null,
      referralSource: data.referralSource ?? null,
      status: "enquiry",
    })
    .returning();

  // Record initial status in history
  await db.insert(statusHistoryTable).values({
    bookingId: booking.id,
    fromStatus: null,
    toStatus: "enquiry",
    changedBy: "system",
    note: "Booking submitted by parent",
  });

  // Check if referral source is Friend/Family and referredBy details are provided
  if (data.referralSource === "Friend/Family" && data.referredByName && data.referredByPhone) {
    await db.insert(referralRewardsTable).values({
      bookingId: booking.id,
      referrerName: data.referredByName,
      referrerPhone: data.referredByPhone,
      referrerEmail: data.referredByEmail ?? null,
      rewardStatus: "pending",
    });
  }

  res.status(201).json(formatBooking(booking));
});

// GET /bookings/:id and /booking/:id (Alias)
router.get(["/bookings/:id", "/booking/:id"], async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid booking id" });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, id))
    .limit(1);

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const statusHistory = await db
    .select()
    .from(statusHistoryTable)
    .where(eq(statusHistoryTable.bookingId, id))
    .orderBy(statusHistoryTable.changedAt);

  const notes = await db
    .select()
    .from(notesTable)
    .where(eq(notesTable.bookingId, id))
    .orderBy(desc(notesTable.createdAt));

  const [referralReward] = await db
    .select()
    .from(referralRewardsTable)
    .where(eq(referralRewardsTable.bookingId, id))
    .limit(1);

  res.json({
    ...formatBooking(booking),
    statusHistory: statusHistory.map((h) => ({
      id: h.id,
      bookingId: h.bookingId,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      changedBy: h.changedBy,
      note: h.note,
      changedAt: h.changedAt.toISOString(),
    })),
    notes: notes.map((n) => ({
      id: n.id,
      bookingId: n.bookingId,
      content: n.content,
      author: n.author,
      createdAt: n.createdAt.toISOString(),
    })),
    referralReward: referralReward
      ? {
          ...referralReward,
          createdAt: referralReward.createdAt.toISOString(),
          updatedAt: referralReward.updatedAt.toISOString(),
        }
      : null,
  });
});

// PATCH /bookings/:id/status and PUT /bookings/:id/status (Alias)
const handleStatusUpdate = async (req: any, res: any) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid booking id" });
    return;
  }

  const parseResult = UpdateBookingStatusBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid status update data" });
    return;
  }

  const { status, assignedTo, note, followUpDate } = parseResult.data;

  const [existing] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, id))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const updateValues: Partial<typeof bookingsTable.$inferSelect> = {
    status,
    updatedAt: new Date(),
  };
  if (assignedTo !== undefined) updateValues.assignedTo = assignedTo;
  if (followUpDate !== undefined) updateValues.followUpDate = followUpDate;

  const [updated] = await db
    .update(bookingsTable)
    .set(updateValues)
    .where(eq(bookingsTable.id, id))
    .returning();

  // Record status change in history
  await db.insert(statusHistoryTable).values({
    bookingId: id,
    fromStatus: existing.status,
    toStatus: status,
    changedBy: assignedTo ?? "admin",
    note: note ?? null,
  });

  // Check if status is admission_confirmed and update referral reward status to eligible
  if (status === "admission_confirmed") {
    const [reward] = await db
      .select()
      .from(referralRewardsTable)
      .where(
        and(
          eq(referralRewardsTable.bookingId, id),
          eq(referralRewardsTable.rewardStatus, "pending")
        )
      )
      .limit(1);

    if (reward) {
      await db
        .update(referralRewardsTable)
        .set({
          rewardStatus: "eligible",
          updatedAt: new Date(),
        })
        .where(eq(referralRewardsTable.id, reward.id));

      await db.insert(notesTable).values({
        bookingId: id,
        content: `Referral reward upgraded to ELIGIBLE for referrer ${reward.referrerName} (${reward.referrerPhone})`,
        author: "System",
      });
    }
  }

  res.json(formatBooking(updated));
};

router.patch("/bookings/:id/status", handleStatusUpdate);
router.put("/bookings/:id/status", handleStatusUpdate);

// PUT /update-status (Alias for status updates that pass ID in body)
router.put("/update-status", async (req, res) => {
  const { id, status, assignedTo, note, followUpDate } = req.body;
  const bookingId = parseInt(id);
  if (isNaN(bookingId)) {
    res.status(400).json({ error: "Invalid or missing booking id in body" });
    return;
  }

  const [existing] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, bookingId))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  // Validate status if provided
  if (status && !bookingStatusEnum.includes(status)) {
    res.status(400).json({ error: "Invalid status value" });
    return;
  }

  const updateValues: Partial<typeof bookingsTable.$inferSelect> = {
    updatedAt: new Date(),
  };
  if (status !== undefined) updateValues.status = status;
  if (assignedTo !== undefined) updateValues.assignedTo = assignedTo;
  if (followUpDate !== undefined) updateValues.followUpDate = followUpDate;

  const [updated] = await db
    .update(bookingsTable)
    .set(updateValues)
    .where(eq(bookingsTable.id, bookingId))
    .returning();

  // Record status change in history
  await db.insert(statusHistoryTable).values({
    bookingId,
    fromStatus: existing.status,
    toStatus: status || existing.status,
    changedBy: assignedTo ?? "admin",
    note: note ?? null,
  });

  // Check if status is admission_confirmed and update referral reward status to eligible
  if (status === "admission_confirmed") {
    const [reward] = await db
      .select()
      .from(referralRewardsTable)
      .where(
        and(
          eq(referralRewardsTable.bookingId, bookingId),
          eq(referralRewardsTable.rewardStatus, "pending")
        )
      )
      .limit(1);

    if (reward) {
      await db
        .update(referralRewardsTable)
        .set({
          rewardStatus: "eligible",
          updatedAt: new Date(),
        })
        .where(eq(referralRewardsTable.id, reward.id));

      await db.insert(notesTable).values({
        bookingId: bookingId,
        content: `Referral reward upgraded to ELIGIBLE for referrer ${reward.referrerName} (${reward.referrerPhone})`,
        author: "System",
      });
    }
  }

  res.json(formatBooking(updated));
});


// POST /bookings/:id/notes
router.post("/bookings/:id/notes", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid booking id" });
    return;
  }

  const parseResult = AddNoteBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid note data" });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, id))
    .limit(1);

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const [note] = await db
    .insert(notesTable)
    .values({
      bookingId: id,
      content: parseResult.data.content,
      author: parseResult.data.author,
    })
    .returning();

  res.status(201).json({
    id: note.id,
    bookingId: note.bookingId,
    content: note.content,
    author: note.author,
    createdAt: note.createdAt.toISOString(),
  });
});

// GET /calendar-slots
router.get("/calendar-slots", async (req, res) => {
  const parseResult = GetCalendarSlotsQueryParams.safeParse(req.query);
  const month = parseResult.success && parseResult.data.month
    ? parseResult.data.month
    : new Date().toISOString().slice(0, 7);

  const [year, mon] = month.split("-").map(Number);
  const startDate = `${year}-${String(mon).padStart(2, "0")}-01`;
  const endDate = new Date(year, mon, 0);
  const endDateStr = `${year}-${String(mon).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  const bookedSlots = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        gte(bookingsTable.date, startDate),
        lte(bookingsTable.date, endDateStr),
        sql`${bookingsTable.status} != 'cancelled'`
      )
    );

  const slots: Array<{
    date: string;
    timeSlot: string;
    isBooked: boolean;
    bookingsCount: number;
    bookingId: number | null;
    parentName: string | null;
    childName: string | null;
  }> = [];

  for (let d = 1; d <= endDate.getDate(); d++) {
    const dateStr = `${year}-${String(mon).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayOfWeek = new Date(dateStr).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    for (const slot of TIME_SLOTS) {
      const slotBookings = bookedSlots.filter(
        (b) => b.date === dateStr && b.timeSlot === slot
      );
      slots.push({
        date: dateStr,
        timeSlot: slot,
        isBooked: slotBookings.length >= 10,
        bookingsCount: slotBookings.length,
        bookingId: slotBookings[0]?.id ?? null,
        parentName: slotBookings[0]?.parentName ?? null,
        childName: slotBookings[0]?.childName ?? null,
      });
    }
  }

  res.json(slots);
});

// GET /dashboard/stats
router.get("/dashboard/stats", async (req, res) => {
  const allBookings = await db.select().from(bookingsTable);

  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const stats = {
    total: allBookings.length,
    enquiries: allBookings.filter((b) => b.status === "enquiry").length,
    tourScheduled: allBookings.filter((b) => b.status === "tour_scheduled").length,
    demo: allBookings.filter((b) => b.status === "demo").length,
    followUp: allBookings.filter((b) => b.status === "follow_up").length,
    admissionConfirmed: allBookings.filter((b) => b.status === "admission_confirmed").length,
    cancelled: allBookings.filter((b) => b.status === "cancelled").length,
    todayTours: allBookings.filter(
      (b) => b.date === today && b.status !== "cancelled"
    ).length,
    thisWeekTours: allBookings.filter(
      (b) => b.date >= today && b.date <= weekEnd && b.status !== "cancelled"
    ).length,
  };

  res.json(stats);
});

// GET /dashboard/upcoming
router.get("/dashboard/upcoming", async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const upcoming = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        gte(bookingsTable.date, today),
        lte(bookingsTable.date, weekEnd),
        sql`${bookingsTable.status} != 'cancelled'`
      )
    )
    .orderBy(bookingsTable.date, bookingsTable.timeSlot);

  res.json(upcoming.map(formatBooking));
});

// POST /bookings/:id/send-whatsapp
// Sends a real WhatsApp message to the parent using Meta's Cloud API.
router.post("/bookings/:id/send-whatsapp", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid booking id" });
    return;
  }

  const { message } = req.body as { message?: string };
  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "message body is required" });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, id))
    .limit(1);

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  // Use the dedicated whatsapp field if set, otherwise fall back to phone
  const recipient = booking.whatsapp || booking.phone;
  if (!recipient) {
    res.status(422).json({ error: "No WhatsApp or phone number on record for this booking" });
    return;
  }

  const result = await sendWhatsAppMessage(recipient, message.trim());

  if (!result.success) {
    res.status(502).json({ error: result.error ?? "Failed to send WhatsApp message" });
    return;
  }

  res.json({ success: true, messageId: result.messageId });
});

// POST /bookings/:id/send-email
// Sends an email to the parent using Mailercloud Email API v2.0.
router.post("/bookings/:id/send-email", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid booking id" });
    return;
  }

  const { subject, message } = req.body as { subject?: string; message?: string };
  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "message body is required" });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, id))
    .limit(1);

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const recipient = booking.email;
  if (!recipient) {
    res.status(422).json({ error: "No email address on record for this booking" });
    return;
  }

  // Parse subject and body from template if needed
  let emailSubject = subject || `Update regarding your booking`;
  let emailBody = message.trim();

  // If the template text starts with "Subject: ...", extract the subject line
  if (emailBody.startsWith("Subject:")) {
    const match = emailBody.match(/^Subject:\s*(.*?)\n\n([\s\S]*)$/);
    if (match) {
      emailSubject = match[1];
      emailBody = match[2];
    }
  }

  const result = await sendEmailMessage(recipient, emailSubject, emailBody);

  if (!result.success) {
    res.status(502).json({ error: result.error ?? "Failed to send email" });
    return;
  }

  res.json({ success: true, messageId: result.messageId });
});

// DELETE /bookings/:id
router.delete("/bookings/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid booking ID" });
    return;
  }

  // Check if booking exists
  const existing = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, id))
    .limit(1);

  if (existing.length === 0) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  // Delete the booking (references will cascade delete)
  await db.delete(bookingsTable).where(eq(bookingsTable.id, id));

  res.json({ status: "ok" });
});

export default router;
