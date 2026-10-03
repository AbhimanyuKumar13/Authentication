import Bill from "../models/BillModel.js";
import CompanyProfile from "../models/CompanyProfileModel.js";
import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";

export const calculateTotals = (items, interstate = false) => {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );
  const tax = subtotal * 0.18;
  const cgst = interstate ? 0 : tax / 2;
  const sgst = interstate ? 0 : tax / 2;
  const igst = interstate ? tax : 0;
  const total = subtotal + tax;

  return { subtotal, cgst, sgst, igst, tax, total };
};

export const saveCompanyProfile = catchAsyncError(async (req, res, next) => {
  const profile = req.body || {};
  if (!profile.name) {
    return next(new ErrorHandler("Company name is required.", 400));
  }

  const saved = await CompanyProfile.findOneAndUpdate(
    { user: req.user._id },
    { ...profile, user: req.user._id },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

  res
    .status(200)
    .json({ success: true, data: saved, message: "Company profile saved." });
});

export const getCompanyProfile = catchAsyncError(async (req, res) => {
  const profile = await CompanyProfile.findOne({ user: req.user._id });
  res.status(200).json({ success: true, data: profile || null });
});

export const createBill = catchAsyncError(async (req, res, next) => {
  const payload = req.body || {};
  const { client, company, items = [], billNumber, billDate } = payload;

  if (
    !billNumber ||
    !billDate ||
    !client?.name ||
    !company?.name ||
    !items.length
  ) {
    return next(
      new ErrorHandler(
        "Bill number, bill date, client name, company name and at least one item are required.",
        400,
      ),
    );
  }

  const totals = calculateTotals(items, Boolean(payload.interstate));
  const document = await Bill.create({
    ...payload,
    user: req.user._id,
    ...totals,
    deleted: false,
    deletedAt: null,
  });

  res.status(201).json({
    success: true,
    data: document,
    message: "Bill created successfully.",
  });
});

export const getBills = catchAsyncError(async (req, res) => {
  const { includeDeleted } = req.query;
  const filter = {
    user: req.user._id,
    ...(includeDeleted === "true" ? {} : { deleted: false }),
  };
  const bills = await Bill.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: bills });
});

export const getBillById = catchAsyncError(async (req, res, next) => {
  const bill = await Bill.findOne({ _id: req.params.id, user: req.user._id });
  if (!bill) {
    return next(new ErrorHandler("Bill not found.", 404));
  }
  res.status(200).json({ success: true, data: bill });
});

export const updateBill = catchAsyncError(async (req, res, next) => {
  const { items = [], client, company, billNumber, billDate } = req.body || {};
  if (
    !billNumber ||
    !billDate ||
    !client?.name ||
    !company?.name ||
    !items.length
  ) {
    return next(
      new ErrorHandler(
        "Bill number, bill date, client name, company name and at least one item are required.",
        400,
      ),
    );
  }

  const totals = calculateTotals(items, Boolean(req.body.interstate));
  const bill = await Bill.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    {
      ...req.body,
      user: req.user._id,
      ...totals,
      deleted: false,
      deletedAt: null,
    },
    { new: true, runValidators: true },
  );

  if (!bill) {
    return next(new ErrorHandler("Bill not found.", 404));
  }

  res
    .status(200)
    .json({ success: true, data: bill, message: "Bill updated successfully." });
});

export const deleteBill = catchAsyncError(async (req, res, next) => {
  const bill = await Bill.findOne({ _id: req.params.id, user: req.user._id });
  if (!bill) {
    return next(new ErrorHandler("Bill not found.", 404));
  }

  bill.deleted = true;
  bill.deletedAt = new Date();
  await bill.save();

  res.status(200).json({ success: true, message: "Bill moved to bin." });
});

export const restoreBill = catchAsyncError(async (req, res, next) => {
  const bill = await Bill.findOne({ _id: req.params.id, user: req.user._id });
  if (!bill) {
    return next(new ErrorHandler("Bill not found.", 404));
  }

  bill.deleted = false;
  bill.deletedAt = null;
  await bill.save();

  res.status(200).json({ success: true, message: "Bill restored from bin." });
});

export const getBinBills = catchAsyncError(async (req, res) => {
  const bills = await Bill.find({ user: req.user._id, deleted: true }).sort({
    deletedAt: -1,
  });
  res.status(200).json({ success: true, data: bills });
});

export const permanentlyDeleteBill = catchAsyncError(async (req, res, next) => {
  const bill = await Bill.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
    deleted: true,
  });
  if (!bill) {
    return next(new ErrorHandler("Bill not found.", 404));
  }

  res.status(200).json({ success: true, message: "Bill permanently deleted." });
});
