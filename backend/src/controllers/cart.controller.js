import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";

async function loadPopulatedCart(userId) {
  const cart = await Cart.findOne({ userId }).populate({
    path: "items.productId",
    populate: { path: "sellerId", select: "name" },
  });
  return cart;
}

function serializeCart(cart) {
  if (!cart) return { items: [] };
  const items = cart.items
    .filter((i) => i.productId)
    .map((i) => ({
      product: i.productId,
      quantity: i.quantity,
    }));
  return { items };
}

export async function getCart(req, res) {
  const userId = req.session.userId;
  const cart = await loadPopulatedCart(userId);
  res.json(serializeCart(cart));
}

export async function addItem(req, res) {
  const userId = req.session.userId;
  const { productId, quantity = 1 } = req.body;

  if (!productId) return res.status(400).json({ message: "productId is required" });
  const qty = Math.max(1, Number(quantity) || 1);

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  let cart = await Cart.findOne({ userId });
  if (!cart) cart = new Cart({ userId, items: [] });

  const existing = cart.items.find((i) => i.productId.toString() === productId);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.items.push({ productId, quantity: qty });
  }

  await cart.save();
  const populated = await loadPopulatedCart(userId);
  res.status(201).json(serializeCart(populated));
}

export async function updateItem(req, res) {
  const userId = req.session.userId;
  const { productId } = req.params;
  const { quantity } = req.body;
  const qty = Number(quantity);

  if (!Number.isFinite(qty) || qty < 1) {
    return res.status(400).json({ message: "quantity must be >= 1" });
  }

  const cart = await Cart.findOne({ userId });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const item = cart.items.find((i) => i.productId.toString() === productId);
  if (!item) return res.status(404).json({ message: "Item not in cart" });

  item.quantity = qty;
  await cart.save();
  const populated = await loadPopulatedCart(userId);
  res.json(serializeCart(populated));
}

export async function removeItem(req, res) {
  const userId = req.session.userId;
  const { productId } = req.params;

  const cart = await Cart.findOne({ userId });
  if (!cart) return res.json({ items: [] });

  cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
  await cart.save();
  const populated = await loadPopulatedCart(userId);
  res.json(serializeCart(populated));
}

export async function clearCart(req, res) {
  const userId = req.session.userId;
  await Cart.findOneAndUpdate({ userId }, { items: [] }, { upsert: true });
  res.json({ items: [] });
}
