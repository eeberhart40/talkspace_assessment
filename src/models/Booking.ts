import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/sequelize";
import Credit from "./Credit";

export interface BookingAttributes {
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
  public setCredit!: (credit: Credit) => Promise<void>; // Association method

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// TODO: custom validation for time attribute
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

export default Booking;
