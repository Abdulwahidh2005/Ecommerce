import { Product } from "../models/Product.js";

const VALID_SIZES = ["S", "M", "L", "XL"];
const VALID_CATEGORIES = ["Fashion", "Health", "Art", "Home", "Sport", "Music", "Gaming"];

function validate(body, isUpdate = false) {
  const { title, price, category, sizes } = body;
  if (!isUpdate) {
    if (!title?.trim()) return "Title is required";
    if (price === undefined || price === "") return "Price is required";
    if (!category) return "Category is required";
  }
  if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0))
    return "Price must be a non-negative number";
  if (category && !VALID_CATEGORIES.includes(category))
    return `Category must be one of: ${VALID_CATEGORIES.join(", ")}`;
  if (sizes?.length) {
    const bad = sizes.filter((s) => !VALID_SIZES.includes(s));
    if (bad.length) return `Invalid sizes: ${bad.join(", ")}. Allowed: S M L XL`;
  }
  return null;
}

export async function listMyProducts(req, res) {
  const products = await Product.find({ sellerId: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ products });
}

export async function listAllProducts(_req, res) {
  const products = await Product.find()
    .sort({ createdAt: -1 })
    .populate("sellerId", "name")
    .lean();
  res.json({ products });
}

export async function createProduct(req, res) {
  const error = validate(req.body);
  if (error) return res.status(400).json({ message: error });

  const { title, description, price, category, sizes, stockLevel, imageUrl } = req.body;

  const product = await Product.create({
    title: title.trim(),
    description: description?.trim() || "",
    price: Number(price),
    category,
    sizes: sizes || [],
    stockLevel: Number(stockLevel) || 0,
    imageUrl: imageUrl?.trim() || "",
    sellerId: req.user._id,
  });

  res.status(201).json({ product });
}

export async function updateProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  if (product.sellerId.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Not your product" });

  const error = validate(req.body, true);
  if (error) return res.status(400).json({ message: error });

  const { title, description, price, category, sizes, stockLevel, imageUrl } = req.body;

  if (title !== undefined) product.title = title.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (category !== undefined) product.category = category;
  if (stockLevel !== undefined) product.stockLevel = Number(stockLevel);
  if (imageUrl !== undefined) product.imageUrl = imageUrl.trim();
  if (sizes !== undefined) product.sizes = sizes;

  await product.save();
  res.json({ product });
}

export async function deleteProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  if (product.sellerId.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Not your product" });

  await product.deleteOne();
  res.json({ ok: true });
}
