import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity:  { type: Number, required: true, min: 1 },
    price:     { type: Number, required: true }, // snapshot of price at purchase time
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items:       { type: [orderItemSchema], required: true },
    status:      {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    totalAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
