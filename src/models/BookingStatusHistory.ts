import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/sequelize";

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

export default BookingStatusHistory;
