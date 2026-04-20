import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} from "../controllers/cart.controller.js";

const router = Router();

router.get("/", requireAuth, getCart);
router.post("/items", requireAuth, addItem);
router.patch("/items/:productId", requireAuth, updateItem);
router.delete("/items/:productId", requireAuth, removeItem);
router.delete("/", requireAuth, clearCart);

export default router;
