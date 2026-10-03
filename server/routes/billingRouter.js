import express from "express";
import {
  saveCompanyProfile,
  getCompanyProfile,
  createBill,
  getBills,
  getBillById,
  updateBill,
  deleteBill,
  restoreBill,
  getBinBills,
  permanentlyDeleteBill,
} from "../controllers/billingController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.use(isAuthenticated);

router.post("/company-profile", saveCompanyProfile);
router.get("/company-profile", getCompanyProfile);
router.post("/bills", createBill);
router.get("/bills", getBills);
router.get("/bills/bin", getBinBills);
router.get("/bills/:id", getBillById);
router.put("/bills/:id", updateBill);
router.delete("/bills/:id", deleteBill);
router.patch("/bills/:id/restore", restoreBill);
router.delete("/bills/:id/permanent", permanentlyDeleteBill);

export default router;
