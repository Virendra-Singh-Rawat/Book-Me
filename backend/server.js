import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import dns from "dns";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";
import integrationRoutes from "./routes/integration.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import publicRoutes from "./routes/public.routes.js";
import adminRoutes from "./routes/admin.routes.js";

//Change DNS
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const PORT = process.env.PORT || 5000;
const app = express();

//MIDDLEWARES
app.use(cors());
app.use(express.json());

//DB
await connectDB();

//ROUTES

app.get("/", (req, res) => {
  res.send("API WORKING");
});

app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/services", serviceRoutes);

app.use("/api/availability", availabilityRoutes);

app.use("/api/integrations", integrationRoutes);

app.use("/api/bookings", bookingRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/public", publicRoutes);

app.use("/public", publicRoutes);

const server = http.createServer(app);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.log(`Port ${PORT} is already in use`);
    process.exit(1);
  }
  throw error;
});

server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
