export function notFound(_req, res) {
  res.status(404).json({ message: "Not found" });
}

export function errorHandler(err, _req, res, _next) {
  // eslint-disable-next-line no-console
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Server error",
  });
}

