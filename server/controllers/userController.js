import ErrorHandler from "../middlewares/error.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/UserModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendToken } from "../utils/sendToken.js";
import crypto from "crypto";

export const register = catchAsyncError(async (req, res, next) => {
  const { name, password } = req.body;
  const language = req.body.language === "hi" ? "hi" : "en";
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  if (!name || !email || !password) {
    return next(new ErrorHandler("All fields are required.", 400));
  }
  if (String(password).length < 8 || String(password).length > 32) {
    return next(
      new ErrorHandler("Password must be between 8 and 32 characters.", 400),
    );
  }

  const existingUser = await User.findOne({
    accountVerified: true,
    email,
  });
  if (existingUser) {
    return next(new ErrorHandler("Email is already in use.", 400));
  }

  const pendingUsers = await User.find({
    accountVerified: false,
    email,
  }).sort({ createdAt: -1 });
  if (pendingUsers.length >= 3) {
    return next(
      new ErrorHandler(
        "Too many verification attempts. Please try again later.",
        429,
      ),
    );
  }

  if (pendingUsers.length) {
    await User.deleteMany({
      accountVerified: false,
      email,
    });
  }

  const user = await User.create({
    name: name.trim(),
    email,
    password,
  });
  const verificationCode = user.generateVerificationCode();
  await user.save();
  await sendVerificationCode(verificationCode, name, email, res, language);
});

async function sendVerificationCode(
  verificationCode,
  name,
  email,
  res,
  language,
) {
  try {
    const message = generateEmailTemplate(verificationCode, language);
    await sendEmail({
      email,
      subject:
        language === "hi" ? "आपका ईमेल सत्यापन कोड" : "Your verification code",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Verification email sent to ${name}.`,
    });
  } catch (error) {
    console.error("Verification delivery failed:", error.message);
    return res.status(500).json({
      success: false,
      message:
        "Could not send the verification code. Check the delivery settings and try again.",
    });
  }
}

function generateEmailTemplate(verificationCode, language = "en") {
  if (language === "hi") {
    return `
      <div lang="hi" style="font-family:Arial,'Noto Sans Devanagari',sans-serif;line-height:1.7;max-width:600px;margin:auto;padding:20px;border:1px solid #e0e0e0">
        <h2 style="color:#333">ईमेल सत्यापन</h2>
        <p>पंजीकरण के लिए धन्यवाद। अपना खाता सत्यापित करने हेतु नीचे दिया गया कोड दर्ज करें:</p>
        <div style="font-size:24px;font-weight:bold;color:#167454;margin:20px 0">${verificationCode}</div>
        <p>यदि आपने यह कोड नहीं माँगा है, तो इस ईमेल को अनदेखा कर सकते हैं।</p>
        <p style="color:#888;font-size:12px">यह कोड 10 मिनट में समाप्त हो जाएगा।</p>
      </div>
    `;
  }

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
  const { otp } = req.body;
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  if (!email) {
    return next(new ErrorHandler("Email is required.", 400));
  }
  if (!/^\d{5}$/.test(String(otp || ""))) {
    return next(new ErrorHandler("Enter the 5-digit verification code.", 400));
  }

  const user = await User.findOne({ email, accountVerified: false }).sort({
    createdAt: -1,
  });
  if (!user) {
    return next(
      new ErrorHandler(
        "Pending account not found. Please register again.",
        404,
      ),
    );
  }
  if (
    !user.verificationCode ||
    user.verificationCode.toString() !== String(otp)
  ) {
    return next(new ErrorHandler("Invalid verification code.", 400));
  }
  if (
    !user.verificationCodeExpire ||
    user.verificationCodeExpire.getTime() < Date.now()
  ) {
    return next(
      new ErrorHandler(
        "Verification code has expired. Please register again.",
        400,
      ),
    );
  }

  user.accountVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpire = undefined;
  await user.save({ validateModifiedOnly: true });
  await sendToken(user, 200, "Account verified successfully.", res);
});

export const login = catchAsyncError(async (req, res, next) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const { password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Email and password is required.", 400));
  }
  const user = await User.findOne({ email, accountVerified: true }).select(
    "+password",
  );
  if (!user) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password.", 400));
  }
  await sendToken(user, 200, "Logged in successfully.", res);
});

export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
    .json({
      success: true,
      message: "log out successfully",
    });
});

export const getUser = catchAsyncError(async (req, res, next) => {
  const user = req.user.toObject();
  delete user.verificationCode;
  delete user.verificationCodeExpire;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;

  res.status(200).json({
    success: true,
    user,
  });
});

export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const user = await User.findOne({
    email,
    accountVerified: true,
  });
  if (!user) {
    return next(new ErrorHandler("user not found", 404));
  }
  const resetToken = user.generateResetPasswordToken();

  await user.save({ validateBeforeSave: false });
  const requestOrigin = req.get("origin") || "";
  const isLocalFrontend =
    process.env.NODE_ENV !== "production" &&
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(requestOrigin);
  const frontendUrl = isLocalFrontend
    ? requestOrigin
    : process.env.FRONTEND_URL;
  const resetPasswordUrl = `${frontendUrl}/forgot/reset/${resetToken}`;

  const language = req.body.language === "hi" ? "hi" : "en";
  const message =
    language === "hi"
      ? `<div lang="hi" style="font-family:Arial,'Noto Sans Devanagari',sans-serif;line-height:1.7"><h2>पासवर्ड बदलें</h2><p>नया पासवर्ड चुनने के लिए नीचे दिए गए लिंक का उपयोग करें। यह लिंक 10 मिनट में समाप्त हो जाएगा।</p><p><a href="${resetPasswordUrl}">पासवर्ड बदलें</a></p><p>यदि आपने यह अनुरोध नहीं किया है, तो इस ईमेल को अनदेखा कर सकते हैं।</p></div>`
      : `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Reset your password</h2><p>Use the link below to choose a new password. This link expires in 10 minutes.</p><p><a href="${resetPasswordUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p></div>`;

  try {
    await sendEmail({
      email: user.email,
      subject:
        language === "hi" ? "पासवर्ड बदलने का लिंक" : "Reset your password",
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
        500,
      ),
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
        400,
      ),
    );
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new ErrorHandler(" password and confirm password do not match.", 400),
    );
  }
  if (
    String(req.body.password || "").length < 8 ||
    String(req.body.password).length > 32
  ) {
    return next(
      new ErrorHandler("Password must be between 8 and 32 characters.", 400),
    );
  }

  user.password = req.body.password;
  user.resetPasswordExpire = undefined;
  user.resetPasswordToken = undefined;
  await user.save();

  await sendToken(user, 200, "Password reset successfully.", res);
});
