import express from "express";
import morgan from "morgan";
import cors from "cors";

import memberRoutes from "./routes/members.routes.js";
import packageRoutes from "./routes/packages.routes.js";
import subscriptionRoutes from "./routes/subscriptions.routes.js";
import equipmentRoutes from "./routes/equipment.routes.js";
import usageRoutes from "./routes/usage.routes.js";
import paymentRoutes from "./routes/payments.routes.js";
import reportRoutes from "./routes/reports.routes.js";

import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/members", memberRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/usages", usageRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);

app.use(errorHandler);

export default app;
