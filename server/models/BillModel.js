import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    hsnSac: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const billSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    billNumber: { type: String, required: true, unique: true, trim: true },
    billDate: { type: Date, required: true },
    dueDate: { type: Date },
    invoiceType: { type: String, default: "GST Bill" },
    interstate: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue"],
      default: "draft",
    },
    company: {
      name: { type: String, required: true },
      email: String,
      address: String,
      city: String,
      state: String,
      postalCode: String,
      gstin: String,
      logo: String,
    },
    client: {
      name: { type: String, required: true },
      email: String,
      address: String,
      city: String,
      state: String,
      postalCode: String,
      gstin: String,
    },
    items: [itemSchema],
    subtotal: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const Bill = mongoose.model("Bill", billSchema);

export default Bill;
