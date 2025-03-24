import express from "express";
import {
  addOrUpdateCart,
  updateCartQuantity,
  removeFromCart,
  getCart,
} from "../controllers/Cart.controller.js";

const router = express.Router();

router.post("/add",addOrUpdateCart); // Add or update quantity
router.patch("/update-quantity", updateCartQuantity); // Specific for quantity updates
router.delete("/remove", removeFromCart);
router.get("/", getCart);

export default router;
