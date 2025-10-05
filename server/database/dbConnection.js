import mongoose from "mongoose";

export const connection = () => {
  mongoose
    .connect(process.env.MONGO_URI, {
      dbName: "LoginFN",
    })
    .then(() => {
      console.log("connected to database");
    })
    .catch(() => {
      console.log(`some error occur while connecting to database: ${err}`);
    });
};
