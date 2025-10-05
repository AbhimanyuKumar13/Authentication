import ErrorHandler, { errorMiddleware } from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/UserModel.js";
import twilio from "twilio";
import { sendEmail } from "../utils/sendEmail.js";
import { sendToken } from "../utils/sendToken.js";
import crypto from "crypto"; 
 


export const register = catchAsyncError(async (req, res, next) => {
  try {
    const { name, email, phone, password, verificationMethod } = req.body;
    if (!name || !email || !phone || !password || !verificationMethod) {
      return next(new ErrorHandler("All fields are required.", 400));
    }
    function validatePhoneNumber(phone) {
      const phoneRegex = /^\+\d{10,15}$/;
      return phoneRegex.test(phone);
    }

    if (!validatePhoneNumber(phone)) {
      return next(new ErrorHandler("Invalid phone number.", 400));
    }

    const existingUser = await User.findOne({
      $or: [
        {
          email,
          accountVerified: true,
        },
        {
          phone,
          accountVerified: true,
        },
      ],
    });

    if (existingUser) {
      return next(new ErrorHandler("Phone or Email is already used.", 400));
    }

    const registerationAttemptsByUser = await User.find({
      $or: [
        { phone, accountVerified: false },
        { email, accountVerified: false },
      ],
    });
    if (registerationAttemptsByUser.length > 3) {
      return next(
        new ErrorHandler(
          "You have exceeded the maximum number of attempts (3). Please try again after an hour.",
          400
        )
      );
    }

    const userData = {
      name,
      email,
      phone,
      password,
    };
    const user = await User.create(userData);
    const verificationCode = await user.generateVerificationCode();
    await user.save();
    sendVerificationCode(
      verificationMethod,
      verificationCode,
      name,
      email,
      phone,
      res
    );
  } catch (error) {
    next(error);
  }
});

async function sendVerificationCode(
  verificationMethod,
  verificationCode,
  name,
  email,
  phone,
  res
) {
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  try {
    if (verificationMethod === "email") {
      const message = generateEmailTemplate(verificationCode);
      await sendEmail({ email, subject: "your verification code", message });
      res.status(200).json({
        success: true,
        message: `Verification Email successfully sent to ${name}`,
      });
    } else if (verificationMethod === "phone") {
      const verificationCodeWithSpace = verificationCode
        .toString()
        .split("")
        .join(" ");
      await client.calls.create({
        twiml: `<Response><Say>Your verification code is ${verificationCodeWithSpace}. Your verification code is ${verificationCodeWithSpace}.</Say></Response>`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      res.status(200).json({
        success: true,
        message: `OTP sent`,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Invalid verification methods.",
      });
    }
  } catch (error) {
    console.error("Twilio Error:", error);
    return res.status(500).json({
      success: false,
      message: "verification code failed to send.",
    });
  }
}

function generateEmailTemplate(verificationCode) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0;">
      <h2 style="color: #333;">Email Verification</h2>
      <p>Thank you for registering. Please use the verification code below to complete your sign-up process:</p>
      <div style="font-size: 24px; font-weight: bold; color: #4CAF50; margin: 20px 0;">
        ${verificationCode}
      </div>
      <p>If you did not request this code, you can safely ignore this email.</p>
      <p style="color: #888; font-size: 12px;">This code will expire in 10 minutes.</p>
    </div>
  `;
}

export const verifyOtp = catchAsyncError(async (req, res, next) => {
  const { email, otp, phone } = req.body;
  if (!email && !phone) {
    return next(new ErrorHandler("Phone or Email required.", 400));
  }

  function validatePhoneNumber(phone) {
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(phone);
  }

  if (!validatePhoneNumber(phone)) {
    return next(new ErrorHandler("Invalid phone number.", 400));
  }
  try {
    const userAllEntries = await User.find({
      $or: [
        {
          email,
          accountVerified: false,
        },
        {
          phone,
          accountVerified: false,
        },
      ],
    }).sort({ createdAt: -1 });
 
    if (!userAllEntries || userAllEntries.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    let user;

    if (userAllEntries.length > 1) {
      user = userAllEntries[0];

      await User.deleteMany({
        _id: { $ne: user._id },
        $or: [
          {
            phone,
            accountVerified: false,
          },
          {
            email,
            accountVerified: false,
          },
        ],
      });
    } else {
      user = userAllEntries[0];
    } 
    try {
      if (!otp || user.VerificationCode.toString() !== otp.toString()) {
        return next(new ErrorHandler("Invalid OTP.", 400));
      }
    } catch (err) {
      console.error("OTP comparison failed:", err);
      return next(new ErrorHandler("OTP check failed.", 500));
    }

    const currentTime = Date.now();
    const verificationCodeExpire = new Date(
      user.verificationCodeExpire
    ).getTime();

    if (currentTime > verificationCodeExpire) {
      return next(new ErrorHandler("OTP Expired.", 400));
    }

    user.accountVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpire = null;
    await user.save({ validateModifiedOnly: true });
    sendToken(user, 200, "Account Verified", res);
  } catch (error) {
    console.error("verifyOtp error:", error); // full error in console
    return next(
      new ErrorHandler(error.message || "Internal Server Error", 500)
    );
  }
});

export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Email and password is required.", 400));
  }
  const user = await User.findOne({ email, accountVerified: true }).select(
    "+password"
  );
  if (!user) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }
  sendToken(user, 200, "user logged in successfully", res);
});

export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "log out successfully",
    });
});

export const getUser = catchAsyncError(async (req, res, next) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    user,
  });
});

export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findOne({
    email: req.body.email,
    accountVerified: true,
  });
  if (!user) {
    return next(new ErrorHandler("user not found", 404));
  }
  const resetToken = user.generateResetPasswordToken();

  await user.save({ validateBeforeSave: false });
  const resetPasswordUrl = `${process.env.FRONTEND_URL}/forgot/reset/${resetToken}`;

  const message = `your reset password token is : \n\n ${resetPasswordUrl} \n\n if you have not requested, ignore it.`;

  try {
    sendEmail({
      email: user.email,
      subject: "Reset your password !!",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully.`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new ErrorHandler(
        error.message ? error.message : "can not send reset password token.",
        500
      )
    );
  }
});

export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(
      new ErrorHandler(
        "Reset password token is invalid or has been expired.",
        400
      )
    );
  }
  if(req.body.password !== req.body.confirmPassword){
    return next(
      new ErrorHandler(
        " password and confirm password do not match.",
        400
      )
    );
  }

  user.password = req.body.password;
  user.resetPasswordExpire = undefined;
  user.resetPasswordToken = undefined;
  await user.save();

  sendToken(user, 200, "password reset successfully.", res)

});
