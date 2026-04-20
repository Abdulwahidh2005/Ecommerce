import bcrypt from "bcrypt";
import { User } from "../models/User.js";

const VALID_ROLES = ["customer", "shopper"];

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function serializeUser(user) {
  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
}

export async function register(req, res) {
  const name = String(req.body?.name || "").trim();
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const role = String(req.body?.role || "customer");

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, password required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: "Role must be customer or shopper" });
  }

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, role });

  req.session.userId = user._id.toString();
  res.status(201).json({ user: serializeUser(user) });
}

export async function login(req, res) {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  req.session.userId = user._id.toString();
  res.json({ user: serializeUser(user) });
}

export async function logout(req, res) {
  const isProd = process.env.NODE_ENV === "production";
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Could not logout" });
    res.clearCookie("sid", { httpOnly: true, sameSite: isProd ? "none" : "lax", secure: isProd });
    res.json({ ok: true });
  });
}

export async function me(req, res) {
  const user = await User.findById(req.session?.userId).lean();
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  res.json({ user: serializeUser(user) });
}
