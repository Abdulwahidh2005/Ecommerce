import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Cart } from "../models/Cart.js";

export async function listMyOrders(req, res) {
  const orders = await Order.find({ customerId: req.session.userId })
    .sort({ createdAt: -1 })
    .populate("items.productId")
    .lean();
  res.json({ orders });
}

export async function placeOrder(req, res) {
  const userId = req.session.userId;
  const cart = await Cart.findOne({ userId }).populate("items.productId");
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: "Your cart is empty" });
  }

  const orderItems = [];
  let totalAmount = 0;
  for (const ci of cart.items) {
    const p = ci.productId;
    if (!p) continue;
    orderItems.push({ productId: p._id, quantity: ci.quantity, price: p.price });
    totalAmount += p.price * ci.quantity;
  }

  if (orderItems.length === 0) {
    return res.status(400).json({ message: "Cart items are no longer available" });
  }

  const order = await Order.create({
    customerId: userId,
    items: orderItems,
    totalAmount,
    status: "pending",
  });

  cart.items = [];
  await cart.save();

  res.status(201).json({ order });
}

export async function shopperAnalytics(req, res) {
  const products = await Product.find({ sellerId: req.user._id }).lean();
  const productIds = products.map((p) => p._id);

  const orders = await Order.find({ "items.productId": { $in: productIds } }).lean();

  let totalRevenue = 0;
  let totalUnitsSold = 0;
  const statsMap = {};

  for (const order of orders) {
    for (const item of order.items) {
      const match = productIds.find((id) => id.toString() === item.productId.toString());
      if (!match) continue;

      const pid = item.productId.toString();
      const revenue = item.price * item.quantity;
      totalRevenue += revenue;
      totalUnitsSold += item.quantity;

      if (!statsMap[pid]) {
        statsMap[pid] = {
          product: products.find((p) => p._id.toString() === pid),
          unitsSold: 0,
          revenue: 0,
        };
      }
      statsMap[pid].unitsSold += item.quantity;
      statsMap[pid].revenue += revenue;
    }
  }

  res.json({
    totalRevenue,
    totalUnitsSold,
    totalOrders: orders.length,
    totalProducts: products.length,
    topProducts: Object.values(statsMap).sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5),
  });
}

// Seed a test order — useful for demo/testing without a full storefront
export async function createTestOrder(req, res) {
  const { productId, quantity = 1 } = req.body;
  const product = await Product.findById(productId).lean();
  if (!product) return res.status(404).json({ message: "Product not found" });

  const qty = Math.max(1, Number(quantity));
  const order = await Order.create({
    customerId: req.user._id,
    items: [{ productId: product._id, quantity: qty, price: product.price }],
    totalAmount: product.price * qty,
    status: "pending",
  });

  res.status(201).json({ order });
}
