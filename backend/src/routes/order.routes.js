import { Router } from "express";
import { requireShopper } from "../middleware/requireShopper.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  shopperAnalytics,
  createTestOrder,
  listMyOrders,
  placeOrder,
} from "../controllers/order.controller.js";

const router = Router();

router.get("/my", requireAuth, listMyOrders);
router.post("/", requireAuth, placeOrder);
router.get("/analytics/shopper", requireShopper, shopperAnalytics);
router.post("/test", requireAuth, createTestOrder);

export default router;
