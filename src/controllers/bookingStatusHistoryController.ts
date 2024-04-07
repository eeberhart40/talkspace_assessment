import { Request, Response } from "express";
import BookingStatusHistory from "../models/BookingStatusHistory";

// Add a new booking status history record
export const addBookingStatusHistory = async (req: Request, res: Response) => {
  try {
    const history = await BookingStatusHistory.create(req.body);
    res.status(201).json(history);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Retrieve all booking status history records
export const getAllBookingStatusHistories = async (
  req: Request,
  res: Response
) => {
  try {
    const histories = await BookingStatusHistory.findAll();
    res.json(histories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get booking status history by booking ID
export const getHistoryByBookingId = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const history = await BookingStatusHistory.findAll({
      where: { bookingId },
    });
    if (history) {
      res.json(history);
    } else {
      res.status(404).json({ message: "No history found for this booking" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
