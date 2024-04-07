import { Request, Response } from "express";
import { Credit } from "../models";
import { getMonthlyCreditUsageStats } from "../utils/statistics";

// Function to get credits for a specified patient
export const getCreditsForPatient = async (req: Request, res: Response) => {
  const { patientId } = req.params;
  try {
    // get credits for the specified patient
    const credits = await Credit.findAll({
      where: { patientId },
    });

    // Retrieve the monthly credits used statistics from the database for the specified patient
    const stats = await getMonthlyCreditUsageStats(patientId);

    res.status(200).json({ credits, stats });
  } catch (error) {
    console.error("Error retrieving monthly credits used statistics:", error);
    res.status(500).json({
      error:
        "An error occurred while retrieving monthly credits used statistics.",
    });
  }
};
