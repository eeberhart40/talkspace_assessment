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
import { Sequelize, DataTypes, Model, Optional } from "sequelize";

const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Create a single persistent MySQL database connection pool
const sequelize = new Sequelize(
  "your_db_name",
  "your_db_user",
  "your_db_password",
  {
    host: "localhost",
    dialect: "mysql", // Use the appropriate database dialect
    logging: false, // Disable logging SQL queries (you can enable it for debugging)
  }
);

interface CreditAttributes {
  id: number;
  type: string;
  expirationDate: Date;
  bookingId: number | null;
  patientId: string | null;
}

type CreditCreationAttributes = Optional<CreditAttributes, "id">;

// Define the Credit model
class Credit
  extends Model<CreditAttributes, CreditCreationAttributes>
  implements CreditAttributes
{
  public id!: number;
  public type!: string;
  public expirationDate!: Date;
  public bookingId!: number;
  public patientId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Credit.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfter: new Date().toISOString(),
      },
    },
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    patientId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Credit",
  }
);

interface BookingAttributes {
  id: number;
  time: Date;
  patientId: string | null;
  provider: string;
  status: string;
}

type BookingCreationAttributes = Optional<BookingAttributes, "id" | "status">;

class Booking
  extends Model<BookingAttributes, BookingCreationAttributes>
  implements BookingAttributes
{
  public id!: number;
  public time!: Date;
  public patientId!: string | null;
  public provider!: string;
  public status!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Booking.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    time: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfter: new Date().toISOString(),
      },
    },
    patientId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    sequelize,
    modelName: "Booking",
  }
);

interface BookingStatusHistoryAttributes {
  id: number;
  status: string;
  timestamp: Date;
  bookingId: number;
}

type BookingStatusHistoryCreationAttributes = Optional<
  BookingStatusHistoryAttributes,
  "id"
>;

class BookingStatusHistory
  extends Model<
    BookingStatusHistoryAttributes,
    BookingStatusHistoryCreationAttributes
  >
  implements BookingStatusHistoryAttributes
{
  public id!: number;
  public status!: string;
  public timestamp!: Date;
  public bookingId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

BookingStatusHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "BookingStatusHistory",
  }
);

// Define the relationship between Booking and Credit
Booking.belongsTo(Credit);
Credit.hasOne(Booking);

// Define the relationship between Booking and BookingStatusHistory
Booking.hasMany(BookingStatusHistory);
BookingStatusHistory.belongsTo(Booking);

// Function to get statistics on canceled and rescheduled bookings for a specific provider
async function getStats(providerId: string) {
  try {
    // Retrieve canceled and rescheduled bookings for the specified provider
    const stats = await Booking.findAll({
      attributes: [
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal(
              'DISTINCT CASE WHEN status = "canceled" THEN id END'
            )
          ),
          "canceledBookings",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal(
              'DISTINCT CASE WHEN status = "rescheduled" THEN id END'
            )
          ),
          "rescheduledBookings",
        ],
      ],
      where: {
        provider: providerId,
        [sequelize.Op.or]: [{ status: "canceled" }, { status: "rescheduled" }],
      },
    });

    // Extract the results from the stats
    const [result] = stats;

    // Prepare the statistic information
    const canceledBookings = result.getDataValue("canceledBookings") || 0;
    const rescheduledBookings = result.getDataValue("rescheduledBookings") || 0;

    return [canceledBookings, rescheduledBookings];
  } catch (error) {
    console.error(
      "Error getting cancellation and reschedule statistics:",
      error
    );
    throw error;
  }
}

// Function to get monthly statistics on credits used by a specific patient, including the percentage
async function getCreditsUsedStats(patientId: string) {
  try {
    // Retrieve total credits available for the specified patient
    const totalCreditsQuery = await Credit.sum("type", {
      where: {
        bookingId: null, // Credits not associated with any booking
      },
    });

    // Retrieve monthly credits used by the specified patient
    const stats = await Booking.findAll({
      attributes: [
        [
          sequelize.fn(
            "SUM",
            sequelize.literal(
              'CASE WHEN "Booking"."status" = "confirmed" THEN "Credit"."type" END'
            )
          ),
          "totalCreditsUsed",
        ],
        [sequelize.fn("MONTH", sequelize.col('"Booking"."time"')), "month"],
        [sequelize.fn("YEAR", sequelize.col('"Booking"."time"')), "year"],
      ],
      include: [
        {
          model: Credit,
          attributes: [],
          where: {
            BookingId: sequelize.literal('"Booking"."id"'), // Match Credit to Booking
          },
        },
      ],
      where: {
        patientId,
        status: "confirmed",
      },
      group: ["month", "year"],
    });

    // Extract the results from the stats
    const result = stats.map((row) => ({
      totalCreditsUsed: row.getDataValue("totalCreditsUsed") || 0,
      month: row.getDataValue("month"),
      year: row.getDataValue("year"),
    }));

    // Calculate the percentage for each month
    const totalCreditsAvailable = totalCreditsQuery || 1; // To avoid division by zero
    const monthlyStatsWithPercentage = result.map((row) => ({
      ...row,
      percentageCreditsUsed:
        (row.totalCreditsUsed / totalCreditsAvailable) * 100,
    }));

    return monthlyStatsWithPercentage;
  } catch (error) {
    console.error("Error getting monthly credits used statistics:", error);
    throw error;
  }
}

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
    await BookingStatusHistory.create({ status, bookingId: booking.id });

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
    if (bookings?.[0].provider === userId) stats = await getStats(userId);

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
    const stats = await getCreditsUsedStats(patientId);

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
