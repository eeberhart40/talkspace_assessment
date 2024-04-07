import { Request, Response } from "express";
import Booking from "../models/Booking";

// Create a new booking
export const createBooking = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.create(req.body);
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Retrieve all bookings
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.findAll();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single booking by ID
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id);
    if (booking) {
      res.json(booking);
    } else {
      res.status(404).json({ message: "Booking not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a booking
export const updateBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [updated] = await Booking.update(req.body, { where: { id: id } });

    if (updated) {
      const updatedBooking = await Booking.findByPk(id);
      res.status(200).json(updatedBooking);
    } else {
      res.status(404).json({ message: "Booking not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a booking
export const deleteBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Booking.destroy({ where: { id: id } });

    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Booking not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
