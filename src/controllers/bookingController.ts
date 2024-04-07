import { Request, Response } from "express";
import Sequelize from "sequelize";
import { Credit, Booking, BookingStatusHistory } from "../models";
import { getBookingStatusChangeStats } from "../utils/statistics";

// Function to create a booking with an unused credit
export const createBookingWithCredit = async (req: Request, res: Response) => {
  const { time, patientId, provider } = req.body;
  try {
    const credit = await Credit.findOne({
      where: {
        expirationDate: {
          [Sequelize.Op.gt]: new Date(),
        },
        bookingId: null,
      },
    });

    if (!credit) {
      return res
        .status(404)
        .json({ error: "No unused, non-expired credits found." });
    }

    const booking = await Booking.create({ time, patientId, provider });

    await BookingStatusHistory.create({
      status: "initial",
      bookingId: booking.id,
    });

    // Associate the booking with the credit
    await booking.setCredit(credit);
    await credit.update({ bookingId: booking.id });

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the booking." });
  }
};

// Function to retrieve bookings for a specific user (patientId or provider)
export const getBookingsForUser = async (req: Request, res: Response) => {
  const { userId } = req.query;

  if (!userId) {
    return res
      .status(400)
      .json({ error: "User ID must be provided as a query parameter." });
  }

  try {
    const bookings = await Booking.findAll({
      where: {
        [Sequelize.Op.or]: [{ patientId: userId }, { provider: userId }],
      },
      include: [{ model: BookingStatusHistory }],
    });

    // Fetch booking status change statistics for the user
    const statusChangeStats = await getBookingStatusChangeStats(userId);

    res.status(200).json({ bookings, statusChangeStats });
  } catch (error) {
    console.error("Error retrieving bookings:", error);
    res.status(500).json({
      error: "An error occurred while retrieving bookings.",
    });
  }
};
