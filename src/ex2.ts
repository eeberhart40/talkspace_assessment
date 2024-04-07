/*
I asked chatGPT to build for me a simple booking system with features for creating both standard and anonymous bookings. 
Users can specify details like time, patient, provider, and booking status. 
The application records booking status changes over time, providing a comprehensive status history. 
Additionally, it associates bookings with unused credits and allows users to retrieve their booking history or the timeline of status changes for a specific booking. 
The database is managed through Sequelize, offering a relational mapping to a MySQL database.
Please also allow to show the provider some statistic about bookings getting canceled by the client and being rescheduled, and the patient statistic about how many credits he used per month.
*/

import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import sequelize from "./config/sequelize";
import Credit from "./models/Credit";
import Booking from "./models/Booking";
import BookingStatusHistory from "./models/BookingStatusHistory";

const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Define the relationship between Booking and Credit
Booking.belongsTo(Credit);
Credit.hasOne(Booking);

// Define the relationship between Booking and BookingStatusHistory
Booking.hasMany(BookingStatusHistory);
BookingStatusHistory.belongsTo(Booking);

// Endpoint to create a booking with an unused credit
app.post("/bookings", async (req: Request, res: Response) => {
  const { time, patientId, provider } = req.body;

  try {
    // Find an unused credit that is not expired
    const d = new Date();
    const credit = await Credit.findOne({
      where: {
        expirationDate: {
          [sequelize.Op.gt]: d, // Expiration date is greater than the current date
        },
        bookingId: null, // Credit is not associated with any booking
      },
    });

    if (!credit) {
      return res
        .status(404)
        .json({ error: "No unused, non-expired credits found." });
    }

    // Create a booking associated with the credit
    const booking = await Booking.create({ time, patientId, provider });

    // Record the initial status in the booking status history
    await BookingStatusHistory.create({
      status: booking.status,
      bookingId: booking.id,
    });

    // Associate the booking with the credit
    await booking.setCredit(credit);

    res.status(201).json({
      message: "Booking created successfully",
      booking: booking.toJSON(),
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the booking." });
  }
});

// Endpoint to retrieve bookings for a specific user (patientId or provider)
app.get("/bookings", async (req: Request, res: Response) => {
  const { userId } = req.query;

  if (!userId) {
    return res
      .status(400)
      .json({ error: "User ID must be provided as a query parameter." });
  }

  try {
    // Retrieve bookings from the database for the specified user
    const bookings = await Booking.findAll({
      where: {
        [sequelize.Op.or]: [{ patientId: userId }, { provider: userId }],
      },
    });

    let stats = [];
    if (bookings?.[0].provider === userId)
      stats = await getBookingStatusChangeStats(userId);

    res.status(200).json({ bookings, stats });
  } catch (error) {
    console.error("Error retrieving bookings:", error);
    res
      .status(500)
      .json({ error: "An error occurred while retrieving bookings." });
  }
});

app.get("/bookings/:bookingId/history", async (req: Request, res: Response) => {
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
});

app.get("/credits/:patientId", async (req: Request, res: Response) => {
  const { patientId } = req.params;

  try {
    // get credits for the specified patient
    const credits = await Credit.findAll({
      where: {
        patientId,
      },
    });
    // Retrieve the monthly credits used statistics from the database for the specified patient
    const stats = await getMonthlyCreditUsageStats(patientId);

    res.status(200).json({ credits, stats });
  } catch (error) {
    console.error("Error retrieving monthly credits used statistics:", error);
    res.status(500).json({
      error:
        "An error occurred while retrieving monthly credits used statistics.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
