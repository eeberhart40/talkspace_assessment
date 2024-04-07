import { Request, Response, NextFunction, ErrorRequestHandler } from "express";

const errorHandler: ErrorRequestHandler = (
  err,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack); // Log the error stack for debugging

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Default to 500 if statusCode is not set
  res.status(statusCode);

  res.json({
    message: err.message,
    // Include the stack trace in development mode for debugging; remove for production
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
  });
};

export default errorHandler;
