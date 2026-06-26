import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { staffTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";
import { StaffLoginBody, RegisterStaffBody } from "@workspace/api-zod";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const parseResult = StaffLoginBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid login data" });
    return;
  }

  const { username, password } = parseResult.data;

  const [staff] = await db
    .select()
    .from(staffTable)
    .where(eq(staffTable.username, username))
    .limit(1);

  if (!staff) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const valid = await bcrypt.compare(password, staff.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  req.session.staffId = staff.id;
  req.session.staffRole = staff.role;

  res.json({ id: staff.id, username: staff.username, name: staff.name, role: staff.role });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ status: "ok" });
  });
});

router.get("/auth/me", async (req, res) => {
  if (!req.session.staffId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [staff] = await db
    .select()
    .from(staffTable)
    .where(eq(staffTable.id, req.session.staffId))
    .limit(1);

  if (!staff) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Session invalid" });
    return;
  }

  res.json({ id: staff.id, username: staff.username, name: staff.name, role: staff.role });
});

// Register new staff (admin only)
router.post("/auth/register", async (req, res) => {
  if (!req.session.staffId) {
    res.status(401).json({ error: "Not authenticated. Only admins can register new staff." });
    return;
  }
  if (req.session.staffRole !== "admin") {
    res.status(403).json({ error: "Only admins can register new staff." });
    return;
  }

  const parseResult = RegisterStaffBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid registration data" });
    return;
  }

  const { username, password, name, role } = parseResult.data;

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const [existing] = await db
    .select()
    .from(staffTable)
    .where(eq(staffTable.username, username))
    .limit(1);

  if (existing) {
    res.status(409).json({ error: "Username already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [newStaff] = await db
    .insert(staffTable)
    .values({ username, passwordHash, name, role })
    .returning();

  res.status(201).json({
    id: newStaff.id,
    username: newStaff.username,
    name: newStaff.name,
    role: newStaff.role,
  });
});

// List all staff (admin only)
router.get("/auth/staff", async (req, res) => {
  if (!req.session.staffId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const allStaff = await db.select().from(staffTable).orderBy(staffTable.createdAt);

  res.json(
    allStaff.map((s) => ({
      id: s.id,
      username: s.username,
      name: s.name,
      role: s.role,
    }))
  );
});

// Delete staff (admin only, cannot delete self)
router.delete("/auth/staff/:id", async (req, res) => {
  if (!req.session.staffId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.session.staffRole !== "admin") {
    res.status(403).json({ error: "Only admins can delete staff" });
    return;
  }

  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  if (id === req.session.staffId) {
    res.status(400).json({ error: "You cannot delete your own account" });
    return;
  }

  const [existing] = await db
    .select()
    .from(staffTable)
    .where(eq(staffTable.id, id))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Staff not found" });
    return;
  }

  await db.delete(staffTable).where(eq(staffTable.id, id));

  res.json({ status: "ok" });
});

// Update staff password (admin only)
router.put("/auth/staff/:id/password", async (req, res) => {
  if (!req.session.staffId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.session.staffRole !== "admin") {
    res.status(403).json({ error: "Only admins can update staff passwords" });
    return;
  }

  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { password } = req.body;
  if (!password || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const [existing] = await db
    .select()
    .from(staffTable)
    .where(eq(staffTable.id, id))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Staff not found" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db
    .update(staffTable)
    .set({ passwordHash })
    .where(eq(staffTable.id, id));

  res.json({ status: "ok" });
});

export default router;
