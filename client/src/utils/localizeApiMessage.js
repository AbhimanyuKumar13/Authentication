import i18n from "../i18n.js";

const messageKeys = {
  "all fields are required.": "api.allFieldsRequired",
  "password must be between 8 and 32 characters.": "api.passwordLength",
  "email is already in use.": "api.emailInUse",
  "too many verification attempts. please try again later.":
    "api.tooManyAttempts",
  "could not send the verification code. check the delivery settings and try again.":
    "api.verificationSendFailed",
  "email is required.": "api.emailRequired",
  "enter the 5-digit verification code.": "api.enterOtp",
  "pending account not found. please register again.":
    "api.pendingAccountMissing",
  "invalid verification code.": "api.invalidOtp",
  "verification code has expired. please register again.": "api.expiredOtp",
  "account verified successfully.": "api.accountVerified",
  "email and password is required.": "api.emailAndPasswordRequired",
  "invalid email or password.": "api.invalidCredentials",
  "logged in successfully.": "api.loggedIn",
  "log out successfully": "api.loggedOut",
  "user not found": "api.userNotFound",
  "reset password token is invalid or has been expired.":
    "api.invalidResetToken",
  "password and confirm password do not match.": "api.passwordMismatch",
  "password reset successfully.": "api.passwordReset",
  "company name is required.": "api.companyNameRequired",
  "company profile saved.": "api.companySaved",
  "bill number, bill date, client name, company name and at least one item are required.":
    "api.billFieldsRequired",
  "bill created successfully.": "api.billCreated",
  "bill not found.": "api.billNotFound",
  "bill updated successfully.": "api.billUpdated",
  "bill moved to bin.": "api.billMovedToBin",
  "bill restored from bin.": "api.billRestored",
  "bill permanently deleted.": "api.billDeleted",
  "internal server error.": "api.internalError",
};

export const localizeApiMessage = (message, t, fallback) => {
  if (!message) return fallback;

  const normalizedMessage = String(message).trim().toLocaleLowerCase();
  const key = messageKeys[normalizedMessage];
  if (key) return t(key);

  const verificationMatch = String(message).match(
    /^Verification email sent to (.+)\.$/,
  );
  if (verificationMatch)
    return t("api.verificationSent", { name: verificationMatch[1] });

  const emailMatch = String(message).match(
    /^Email sent to (.+) successfully\.$/,
  );
  if (emailMatch) return t("api.emailSent", { email: emailMatch[1] });

  return i18n.resolvedLanguage === "hi" ? fallback : message;
};
