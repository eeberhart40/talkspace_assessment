import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/sequelize";

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

export default Credit;
