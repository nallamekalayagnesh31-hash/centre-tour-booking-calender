import pg from "pg";

const { Client } = pg;
const connectionString = process.env.DATABASE_URL || "postgres://postgres@127.0.0.1:5432/centre_tour_booking";

// Helper to format date relative to today
function getDateStr(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("Connecting to database to seed mock bookings...");
  const client = new Client({ connectionString });
  await client.connect();

  // Clear previous mock data to prevent duplication
  console.log("Cleaning up existing mock bookings...");
  await client.query("DELETE FROM status_history");
  await client.query("DELETE FROM booking_notes");
  await client.query("DELETE FROM bookings");

  const bookings = [
    {
      parentName: "Amit Patel",
      phone: "+91 98765 43210",
      email: "amit.patel@example.com",
      childName: "Aarav Patel",
      childAge: "2-3 yrs",
      preferredClass: "Playgroup",
      referralSource: "Google Search",
      date: getDateStr(-5),
      timeSlot: "10:00 AM",
      status: "admission_confirmed",
      assignedTo: "deepa",
      message: "Looking for a playgroup with focus on sensory play.",
      whatsapp: "+91 98765 43210",
      followUpDate: null,
      history: [
        { to: "enquiry", by: "system", note: "Booking submitted by parent", offset: -5 },
        { to: "tour_scheduled", by: "deepa", note: "Spoke to parent, scheduled tour for yesterday", offset: -4 },
        { to: "demo", by: "deepa", note: "Tour went well. Invited to demo class.", offset: -3 },
        { to: "follow_up", by: "deepa", note: "Demo completed. Parent requested fee discount.", offset: -2 },
        { to: "admission_confirmed", by: "deepa", note: "Admission fees paid. Documents submitted.", offset: -1 }
      ],
      notes: [
        { author: "deepa", content: "Parent is very keen on safety features. Showed them the CCTV monitor.", offset: -4 },
        { author: "deepa", content: "Aarav loved the sand pit in the play area.", offset: -3 }
      ]
    },
    {
      parentName: "Meera Sen",
      phone: "+91 98111 22233",
      email: "meera.sen@example.com",
      childName: "Riya Sen",
      childAge: "3-4 yrs",
      preferredClass: "Nursery",
      referralSource: "Friend/Family",
      date: getDateStr(-2),
      timeSlot: "11:00 AM",
      status: "follow_up",
      assignedTo: "deepa",
      message: "My friend recommended this centre.",
      whatsapp: "+91 98111 22233",
      followUpDate: getDateStr(1),
      history: [
        { to: "enquiry", by: "system", note: "Booking submitted by parent", offset: -5 },
        { to: "tour_scheduled", by: "deepa", note: "Scheduled tour", offset: -4 },
        { to: "follow_up", by: "deepa", note: "Tour done, parent wants to discuss with spouse", offset: -2 }
      ],
      notes: [
        { author: "deepa", content: "Referred by Aarav's mother. Offered friend-referral discount.", offset: -4 }
      ]
    },
    {
      parentName: "Rohan Sharma",
      phone: "+91 98222 33344",
      email: "rohan.sharma@example.com",
      childName: "Kavya Sharma",
      childAge: "4-5 yrs",
      preferredClass: "Kindergarten I",
      referralSource: "Social Media",
      date: getDateStr(0), // Today
      timeSlot: "10:00 AM",
      status: "tour_scheduled",
      assignedTo: "kavita",
      message: "Interested in the curriculum and activities.",
      whatsapp: "+91 98222 33344",
      followUpDate: null,
      history: [
        { to: "enquiry", by: "system", note: "Booking submitted by parent", offset: -2 },
        { to: "tour_scheduled", by: "kavita", note: "Tour scheduled for today", offset: -1 }
      ],
      notes: []
    },
    {
      parentName: "Sneha Reddy",
      phone: "+91 98333 44455",
      email: "sneha.reddy@example.com",
      childName: "Ishaan Reddy",
      childAge: "1.5-2 yrs",
      preferredClass: "Playgroup",
      referralSource: "Google Search",
      date: getDateStr(0), // Today
      timeSlot: "2:00 PM",
      status: "tour_scheduled",
      assignedTo: "deepa",
      message: "Is transport facility available?",
      whatsapp: "+91 98333 44455",
      followUpDate: null,
      history: [
        { to: "enquiry", by: "system", note: "Booking submitted by parent", offset: -3 },
        { to: "tour_scheduled", by: "deepa", note: "Tour scheduled", offset: -2 }
      ],
      notes: [
        { author: "deepa", content: "Parent asked about transport route. Checked with van coordinator, route is covered.", offset: -2 }
      ]
    },
    {
      parentName: "Vijay Verma",
      phone: "+91 98444 55566",
      email: "vijay.verma@example.com",
      childName: "Ananya Verma",
      childAge: "3-4 yrs",
      preferredClass: "Nursery",
      referralSource: "Flyer/Banner",
      date: getDateStr(1), // Tomorrow
      timeSlot: "9:00 AM",
      status: "tour_scheduled",
      assignedTo: null,
      message: "Looking for nursery admission starting next month.",
      whatsapp: "+91 98444 55566",
      followUpDate: null,
      history: [
        { to: "enquiry", by: "system", note: "Booking submitted by parent", offset: -1 }
      ],
      notes: []
    },
    {
      parentName: "Priyanka Das",
      phone: "+91 98555 66677",
      email: "priyanka.das@example.com",
      childName: "Kabir Das",
      childAge: "2-3 yrs",
      preferredClass: "Playgroup",
      referralSource: "Google Search",
      date: getDateStr(2),
      timeSlot: "11:00 AM",
      status: "tour_scheduled",
      assignedTo: "deepa",
      message: "",
      whatsapp: "+91 98555 66677",
      followUpDate: null,
      history: [
        { to: "enquiry", by: "system", note: "Booking submitted by parent", offset: -2 },
        { to: "tour_scheduled", by: "deepa", note: "Tour scheduled for day after tomorrow", offset: -1 }
      ],
      notes: []
    },
    {
      parentName: "Sanjay Gupta",
      phone: "+91 98666 77788",
      email: "sanjay.gupta@example.com",
      childName: "Vihaan Gupta",
      childAge: "3-4 yrs",
      preferredClass: "Nursery",
      referralSource: "Friend/Family",
      date: getDateStr(-8),
      timeSlot: "3:00 PM",
      status: "cancelled",
      assignedTo: "deepa",
      message: "We need a weekend slot if possible.",
      whatsapp: "+91 98666 77788",
      followUpDate: null,
      history: [
        { to: "enquiry", by: "system", note: "Booking submitted by parent", offset: -8 },
        { to: "cancelled", by: "deepa", note: "Parent cancelled as they moved to another city", offset: -6 }
      ],
      notes: [
        { author: "deepa", content: "Called parent. They got relocated to Bangalore, so cancelling the tour request.", offset: -6 }
      ]
    },
    {
      parentName: "Neha Nair",
      phone: "+91 98777 88899",
      email: "neha.nair@example.com",
      childName: "Aditya Nair",
      childAge: "4-5 yrs",
      preferredClass: "Kindergarten II",
      referralSource: "Other",
      date: getDateStr(-12),
      timeSlot: "4:00 PM",
      status: "admission_confirmed",
      assignedTo: "kavita",
      message: "Transfer case from another preschool.",
      whatsapp: "+91 98777 88899",
      followUpDate: null,
      history: [
        { to: "enquiry", by: "system", note: "Booking submitted", offset: -12 },
        { to: "tour_scheduled", by: "kavita", note: "Tour completed", offset: -11 },
        { to: "admission_confirmed", by: "kavita", note: "Admission confirmed, fees received", offset: -10 }
      ],
      notes: [
        { author: "kavita", content: "Transfer case. Verified their previous preschool transfer certificate.", offset: -11 }
      ]
    },
    {
      parentName: "Rajesh Kumar",
      phone: "+91 98888 99900",
      email: "rajesh.kumar@example.com",
      childName: "Rohan Kumar",
      childAge: "2-3 yrs",
      preferredClass: "Playgroup",
      referralSource: "Google Search",
      date: getDateStr(3),
      timeSlot: "10:00 AM",
      status: "enquiry",
      assignedTo: null,
      message: "Please call me in the evening.",
      whatsapp: "+91 98888 99900",
      followUpDate: null,
      history: [
        { to: "enquiry", by: "system", note: "Booking submitted by parent", offset: 0 }
      ],
      notes: []
    },
    {
      parentName: "Anjali Rao",
      phone: "+91 98999 00011",
      email: "anjali.rao@example.com",
      childName: "Siddharth Rao",
      childAge: "3-4 yrs",
      preferredClass: "Nursery",
      referralSource: "Social Media",
      date: getDateStr(-4),
      timeSlot: "2:00 PM",
      status: "demo",
      assignedTo: "deepa",
      message: "Interested in demo session.",
      whatsapp: "+91 98999 00011",
      followUpDate: getDateStr(-1), // Overdue follow-up
      history: [
        { to: "enquiry", by: "system", note: "Booking submitted", offset: -6 },
        { to: "tour_scheduled", by: "deepa", note: "Tour completed", offset: -5 },
        { to: "demo", by: "deepa", note: "Demo scheduled for child", offset: -4 }
      ],
      notes: [
        { author: "deepa", content: "Siddharth enjoyed the music activity during the demo session.", offset: -4 }
      ]
    }
  ];

  for (const b of bookings) {
    // Insert booking
    const insertBookingQuery = `
      INSERT INTO bookings (
        parent_name, phone, email, child_name, child_age, date, time_slot,
        status, assigned_to, message, whatsapp, preferred_class, referral_source, follow_up_date,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        NOW() + $15 * INTERVAL '1 day', NOW() + $16 * INTERVAL '1 day'
      ) RETURNING id
    `;

    const values = [
      b.parentName, b.phone, b.email, b.childName, b.childAge, b.date, b.timeSlot,
      b.status, b.assignedTo, b.message || null, b.whatsapp || null, b.preferredClass || null,
      b.referralSource || null, b.followUpDate || null, b.history[0]?.offset || 0, b.history[b.history.length - 1]?.offset || 0
    ];

    const res = await client.query(insertBookingQuery, values);
    const bookingId = res.rows[0].id;
    console.log(`Seeded booking for child ${b.childName} (ID: ${bookingId})`);

    // Insert history
    let prevStatus = null;
    for (const h of b.history) {
      const insertHistoryQuery = `
        INSERT INTO status_history (
          booking_id, from_status, to_status, changed_by, note, changed_at
        ) VALUES (
          $1, $2, $3, $4, $5, NOW() + $6 * INTERVAL '1 day'
        )
      `;
      await client.query(insertHistoryQuery, [
        bookingId, prevStatus, h.to, h.by, h.note, h.offset
      ]);
      prevStatus = h.to;
    }

    // Insert notes
    for (const n of b.notes) {
      const insertNoteQuery = `
        INSERT INTO booking_notes (
          booking_id, content, author, created_at
        ) VALUES (
          $1, $2, $3, NOW() + $4 * INTERVAL '1 day'
        )
      `;
      await client.query(insertNoteQuery, [
        bookingId, n.content, n.author, n.offset
      ]);
    }
  }

  await client.end();
  console.log("Mock bookings seeding complete!");
}

main().catch(err => {
  console.error("Error during bookings seeding:", err);
  process.exit(1);
});
