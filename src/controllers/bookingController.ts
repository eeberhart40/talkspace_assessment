import { Request, Response, NextFunction } from "express";
import Sequelize from "sequelize";
import { ErrorResponse } from "../utils/errorUtils";
import { Credit, Booking, BookingStatusHistory } from "../models";
import { getBookingStatusChangeStats } from "../utils/statistics";

// TODO: db transactions, particularly for createBookingWithCredit
// Function to create a booking with an unused credit
export const createBookingWithCredit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { time, patientId, provider } = req.body;

    const credit = await Credit.findOne({
      where: {
        expirationDate: {
          [Sequelize.Op.gt]: new Date(),
        },
        bookingId: null,
      },
    });

    if (!credit) {
      throw new ErrorResponse("No unused, non-expired credits found.", 404);
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
    next(error);
  }
};

// Function to retrieve bookings for a specific user (patientId or provider)
export const getBookingsForUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.query;

  if (!userId) {
    return next(
      new ErrorResponse("User ID must be provided as a query parameter.", 400)
    );
  }

  const bookings = await Booking.findAll({
    where: {
      [Sequelize.Op.or]: [{ patientId: userId }, { provider: userId }],
    },
    include: [{ model: BookingStatusHistory }],
  }).catch(next);

  // Fetch booking status change statistics for the user
  const stats = await getBookingStatusChangeStats(userId).catch(next);

  res.status(200).json({ bookings, stats });
};
