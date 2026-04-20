import { User } from "../models/User.js";

// Loads the user from session, verifies role is "shopper", and attaches
// req.user so downstream controllers don't need another DB round-trip.
export async function requireShopper(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const user = await User.findById(req.session.userId).lean();
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role !== "shopper") {
      return res.status(403).json({ message: "Shopper access required" });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
