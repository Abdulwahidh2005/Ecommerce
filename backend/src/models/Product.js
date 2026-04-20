import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    price:       { type: Number, required: true, min: 0 },
    category:    { type: String, required: true, enum: ["Fashion", "Health", "Art", "Home", "Sport", "Music", "Gaming"] },
    sizes:       [{ type: String, enum: ["S", "M", "L", "XL"] }],
    stockLevel:  { type: Number, default: 0, min: 0 },
    imageUrl:    { type: String, trim: true, default: "" },
    sellerId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
