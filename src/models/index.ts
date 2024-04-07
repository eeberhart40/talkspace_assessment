import Booking from "./Booking";
import Credit from "./Credit";
import BookingStatusHistory from "./BookingStatusHistory";

// Define the relationship between Booking and Credit
Booking.belongsTo(Credit, { foreignKey: "creditId" });
Credit.hasOne(Booking, { foreignKey: "creditId" });

// Define the relationship between Booking and BookingStatusHistory
Booking.hasMany(BookingStatusHistory, { foreignKey: "bookingId" });
BookingStatusHistory.belongsTo(Booking, { foreignKey: "bookingId" });

export { Booking, Credit, BookingStatusHistory };
