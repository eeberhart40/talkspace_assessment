import { Request, Response, NextFunction } from "express";
import { Credit } from "../models";
import { getMonthlyCreditUsageStats } from "../utils/statistics";

// Function to get credits for a specified patient
export const getCreditsForPatient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { patientId } = req.params;

    // Get credits for the specified patient
    const credits = await Credit.findAll({
      where: { patientId },
    });

    // Retrieve the monthly credits used statistics for the specified patient
    const stats = await getMonthlyCreditUsageStats(patientId);

    res.status(200).json({ credits, stats });
  } catch (error) {
    // Pass errors to Express error handling middleware
    next(error);
  }
};
