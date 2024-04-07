import express, { Application } from "express";
import errorHandler from "./middleware/errorHandler";
import bookingRoutes from "./routes/bookingRoutes";
import bookingStatusHistoryRoutes from "./routes/bookingStatusHistoryRoutes";
import creditRoutes from "./routes/creditRoutes";
import apiRateLimit from "./middleware/rateLimit";

const app: Application = express();

app.use(express.json());

// rate limiting middleware
app.use(apiRateLimit);

// routes
app.use(bookingRoutes);
app.use(bookingStatusHistoryRoutes);
app.use(creditRoutes);

// error handler
app.use(errorHandler);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
