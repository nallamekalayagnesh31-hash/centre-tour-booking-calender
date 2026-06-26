import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import bookingsRouter from "./bookings";
import referralsRouter from "./referrals";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(bookingsRouter);
router.use(referralsRouter);

export default router;
