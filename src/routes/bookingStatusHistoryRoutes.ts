import express from "express";
import { getBookingHistoryById } from "../controllers/bookingStatusHistoryController";

const router = express.Router();

router.get("/bookings/:bookingId/history", getBookingHistoryById);

export default router;
