import mongoose from "mongoose";

export const connection = () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      dbName: "BillGeneration",
    })
    .then(() => {
      console.log("connected to database");
    })
    .catch((err) => {
      console.log(
        "some error occur while connecting to database:",
        err.message,
      );
    });
};
