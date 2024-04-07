import express from "express";
import { getBookingHistoryById } from "../controllers/bookingStatusHistoryController";

const router = express.Router();

// TODO: add validation schema and middleware
router.get("/bookings/:bookingId/history", getBookingHistoryById);

export default router;
