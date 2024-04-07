import sequelize from "../config/sequelize";
import Credit from "../models/Credit";
import Booking from "../models/Booking";

type MonthlyCreditUsageResult = {
  totalCreditsUsed: number;
  month: number;
  year: number;
};

export async function getMonthlyCreditUsageStats(patientId: string) {
  try {
    // Retrieve total credits available for the specified patient
    const totalCreditsQuery = await Credit.sum("type", {
      where: {
        bookingId: null, // Credits not associated with any booking
      },
    });

    // Retrieve monthly credits used by the specified patient
    const rawStats = await Booking.findAll({
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
            BookingId: sequelize.literal('"Booking"."id"'), // Attempt to correlate Credits with Bookings, might need adjustment based on actual schema
          },
        },
      ],
      where: {
        patientId,
        status: "confirmed",
      },
      group: [
        sequelize.fn("YEAR", sequelize.col('"Booking"."time"')),
        sequelize.fn("MONTH", sequelize.col('"Booking"."time"')),
      ],
      raw: true, // Important to handle results as plain objects
    });

    // Map rawStats to properly typed objects
    const result: MonthlyCreditUsageResult[] = rawStats.map((row: any) => ({
      totalCreditsUsed: row.totalCreditsUsed
        ? parseInt(row.totalCreditsUsed, 10)
        : 0,
      month: parseInt(row.month, 10),
      year: parseInt(row.year, 10),
    }));

    // Calculate the percentage for each month
    const monthlyStatsWithPercentage = result.map((row) => ({
      ...row,
      percentageCreditsUsed: totalCreditsQuery
        ? (row.totalCreditsUsed / totalCreditsQuery) * 100
        : 0,
    }));

    return monthlyStatsWithPercentage;
  } catch (error) {
    console.error("Error getting monthly credits used statistics:", error);
    throw error;
  }
}

// Function to get statistics on canceled and rescheduled bookings for a specific provider
export async function getBookingStatusChangeStats(
  providerId: string
): Promise<number[]> {
  try {
    // Retrieve the count of canceled bookings
    const canceledBookingsCount = await Booking.count({
      where: {
        provider: providerId,
        status: "canceled",
      },
    });

    // Retrieve the count of rescheduled bookings
    const rescheduledBookingsCount = await Booking.count({
      where: {
        provider: providerId,
        status: "rescheduled",
      },
    });

    return [canceledBookingsCount, rescheduledBookingsCount];
  } catch (error) {
    console.error(
      "Error getting cancellation and reschedule statistics:",
      error
    );
    throw error;
  }
}
