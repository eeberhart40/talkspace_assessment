import { Sequelize } from "sequelize";

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

export default sequelize;
