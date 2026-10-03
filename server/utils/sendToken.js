export const sendToken = async (user, statusCode, message, res) => {
  const token = await user.generateToken();
  const cookieExpireDays = Number.parseInt(process.env.JWT_EXPIRE, 10) || 7;
  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;
  delete safeUser.verificationCode;
  delete safeUser.verificationCodeExpire;
  delete safeUser.resetPasswordToken;
  delete safeUser.resetPasswordExpire;

  res
    .status(statusCode)
    .cookie("token", token, {
      maxAge: cookieExpireDays * 24 * 60 * 60 * 1000,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
    .json({
      success: true,
      message,
      user: safeUser,
    });
};
