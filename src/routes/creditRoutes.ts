import express from "express";
import { getCreditsForPatient } from "../controllers/creditController";

const router = express.Router();

// TODO: add validation schema and middleware
router.get("/credits/:patientId", getCreditsForPatient);

export default router;
