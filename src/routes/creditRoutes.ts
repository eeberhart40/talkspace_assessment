import express from "express";
import { getCreditsForPatient } from "../controllers/creditController";

const router = express.Router();

router.get("/credits/:patientId", getCreditsForPatient);

export default router;
