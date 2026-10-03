import mongoose from "mongoose";

const companyProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    gstin: { type: String, trim: true },
    logo: { type: String, default: "" },
  },
  { timestamps: true },
);

const CompanyProfile = mongoose.model("CompanyProfile", companyProfileSchema);

export default CompanyProfile;
