import { Request, Response, NextFunction } from "express";
import { BookingStatusHistory } from "../models";

// Function to retrieve the booking status history for a specific booking
export const getBookingHistoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { bookingId } = req.params;
    // Retrieve the booking status history from the database for the specified booking
    const history = await BookingStatusHistory.findAll({
      where: { bookingId },
      order: [["timestamp", "ASC"]], // Order by timestamp in ascending order
    });

    res.status(200).json({ history });
  } catch (error) {
    // Pass to express error handling middleware
    next(error);
  }
};
