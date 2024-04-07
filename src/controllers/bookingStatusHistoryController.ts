import { Request, Response } from "express";
import { BookingStatusHistory } from "../models";

// Function to retrieve the booking status history for a specific booking
export const getBookingHistoryById = async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  try {
    // Retrieve the booking status history from the database for the specified booking
    const history = await BookingStatusHistory.findAll({
      where: { bookingId },
      order: [["timestamp", "ASC"]], // Order by timestamp in ascending order
    });

    res.status(200).json({ history });
  } catch (error) {
    console.error("Error retrieving booking status history:", error);
    res.status(500).json({
      error: "An error occurred while retrieving booking status history.",
    });
  }
};
