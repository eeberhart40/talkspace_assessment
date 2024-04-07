import { Request, Response, NextFunction } from "express";
import Sequelize from "sequelize";
import { ErrorResponse } from "../utils/errorUtils";
import { Credit, Booking, BookingStatusHistory } from "../models";
import { getBookingStatusChangeStats } from "../utils/statistics";

// Function to create a booking with an unused credit
export const createBookingWithCredit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
    return next(
      new ErrorResponse("No unused, non-expired credits found.", 404)
    );
  }

  const booking = await Booking.create({ time, patientId, provider }).catch(
    next
  );

  await BookingStatusHistory.create({
    status: "initial",
    bookingId: booking.id,
  }).catch(next);

  // Associate the booking with the credit
  await booking.setCredit(credit).catch(next);
  await credit.update({ bookingId: booking.id }).catch(next);

  res.status(201).json({
    message: "Booking created successfully",
    booking,
  });
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
  const statusChangeStats = await getBookingStatusChangeStats(userId).catch(
    next
  );

  res.status(200).json({ bookings, statusChangeStats });
};
