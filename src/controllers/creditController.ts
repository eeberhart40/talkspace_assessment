import { Request, Response, NextFunction } from "express";
import { Credit } from "../models";
import { getMonthlyCreditUsageStats } from "../utils/statistics";

// Function to get credits for a specified patient
export const getCreditsForPatient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { patientId } = req.params;

  // get credits for the specified patient
  const credits = await Credit.findAll({
    where: { patientId },
  }).catch(next);

  // Retrieve the monthly credits used statistics from the database for the specified patient
  const stats = await getMonthlyCreditUsageStats(patientId).catch(next);

  res.status(200).json({ credits, stats });
};
