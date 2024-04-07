import express from "express";
import {
  createBookingWithCredit,
  getBookingsForUser,
} from "../controllers/bookingController";

const router = express.Router();

router.post("/bookings", createBookingWithCredit);
router.get("/bookings", getBookingsForUser);

export default router;
