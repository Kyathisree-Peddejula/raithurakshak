import { Router } from "express";
import { db } from "@workspace/db";
import { familyMembersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/farmers/:farmerId/family", async (req, res) => {
  try {
    const farmerId = parseInt(req.params.farmerId);
    const members = await db.select().from(familyMembersTable).where(eq(familyMembersTable.farmerId, farmerId));
    res.json(members);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list family members" });
  }
});

router.post("/farmers/:farmerId/family", async (req, res) => {
  try {
    const farmerId = parseInt(req.params.farmerId);
    const { name, relationship, phone } = req.body;
    if (!name || !relationship || !phone) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [member] = await db.insert(familyMembersTable).values({ farmerId, name, relationship, phone }).returning();
    res.status(201).json(member);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to register family member" });
  }
});

router.delete("/farmers/:farmerId/family/:memberId", async (req, res) => {
  try {
    const farmerId = parseInt(req.params.farmerId);
    const memberId = parseInt(req.params.memberId);
    await db.delete(familyMembersTable).where(and(eq(familyMembersTable.id, memberId), eq(familyMembersTable.farmerId, farmerId)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete family member" });
  }
});

export default router;
