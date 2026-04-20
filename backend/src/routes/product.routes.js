import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireShopper } from "../middleware/requireShopper.js";
import {
  listMyProducts,
  listAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

const router = Router();

router.get("/", requireAuth, listAllProducts);
router.get("/my", requireShopper, listMyProducts);
router.post("/", requireShopper, createProduct);
router.put("/:id", requireShopper, updateProduct);
router.delete("/:id", requireShopper, deleteProduct);

export default router;
