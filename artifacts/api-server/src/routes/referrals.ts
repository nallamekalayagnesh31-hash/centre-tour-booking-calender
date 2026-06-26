import { Router } from "express";
import { db } from "@workspace/db";
import { referralRewardsTable, bookingsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET /referral-rewards
router.get("/referral-rewards", async (req, res) => {
  try {
    const referrals = await db
      .select({
        id: referralRewardsTable.id,
        bookingId: referralRewardsTable.bookingId,
        referrerName: referralRewardsTable.referrerName,
        referrerPhone: referralRewardsTable.referrerPhone,
        referrerEmail: referralRewardsTable.referrerEmail,
        rewardStatus: referralRewardsTable.rewardStatus,
        rewardDetails: referralRewardsTable.rewardDetails,
        createdAt: referralRewardsTable.createdAt,
        updatedAt: referralRewardsTable.updatedAt,
        refereeParentName: bookingsTable.parentName,
        refereeChildName: bookingsTable.childName,
        refereeStatus: bookingsTable.status,
        refereeDate: bookingsTable.date,
      })
      .from(referralRewardsTable)
      .innerJoin(bookingsTable, eq(referralRewardsTable.bookingId, bookingsTable.id))
      .orderBy(desc(referralRewardsTable.createdAt));

    res.json(referrals.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /referral-rewards/:id/claim
router.post("/referral-rewards/:id/claim", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid referral reward id" });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(referralRewardsTable)
      .where(eq(referralRewardsTable.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Referral reward not found" });
      return;
    }

    const [updated] = await db
      .update(referralRewardsTable)
      .set({
        rewardStatus: "claimed",
        updatedAt: new Date(),
      })
      .where(eq(referralRewardsTable.id, id))
      .returning();

    res.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
