import { Router, type IRouter } from "express";
import healthRouter from "./health";
import farmersRouter from "./farmers";
import familyRouter from "./family";
import locationsRouter from "./locations";
import alertsRouter from "./alerts";
import weatherRouter from "./weather";
import dashboardRouter from "./dashboard";
import riskRouter from "./risk";
import timelineRouter from "./timeline";

const router: IRouter = Router();

router.use(healthRouter);
router.use(farmersRouter);
router.use(familyRouter);
router.use(locationsRouter);
router.use(alertsRouter);
router.use(weatherRouter);
router.use(dashboardRouter);
router.use(riskRouter);
router.use(timelineRouter);

export default router;
