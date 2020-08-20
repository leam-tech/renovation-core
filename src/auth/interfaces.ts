import { SessionStatusInfo } from "../utils/request";

export interface LoginParams {
  email: string;
  password: string;
}

export interface PinLoginParams {
  user: string;
  pin: string;
}

export interface SendOTPParams {
  mobile: string;
  newOTP?: boolean;
  hash?: string;
}

export interface SendOTPResponse {
  status: "success";
  mobile: string;
}

export interface VerifyOTPParams {
  mobile: string;
  OTP: string;
  loginToUser: boolean;
}

export interface VerifyOTPResponse extends Partial<SessionStatusInfo> {
  status:
    | "no_pin_for_mobile"
    | "no_linked_user"
    | "invalid_pin"
    | "verified"
    | "user_not_found";
  mobile: string;
}

export interface ChangePasswordParams {
  old_password: string;
  new_password: string;
}

export interface PasswordResetInfoParams {
  type: ID_TYPE;
  id: string;
}

export interface ResetPasswordInfo {
  has_medium: number;
  medium: string[];
  hints: ResetInfoHint;
}

export interface ResetInfoHint {
  email: string;
  sms: string;
}

export interface GenerateResetOTPParams extends PasswordResetInfoParams {
  medium_type: OTP_MEDIUM;
  medium_id: string;
}

export interface ResetOTPResponse {
  reason: string;
}

export interface GenerateResetOTPResponse extends ResetOTPResponse {
  sent: number;
}

export interface VerifyResetOTPParams extends GenerateResetOTPParams {
  otp: string;
}

export interface VerifyResetOTPResponse extends ResetOTPResponse {
  verified: number;
  reset_token: string;
}

export interface UpdatePasswordParams {
  reset_token: string;
  new_password: string;
}

export interface UpdatePasswordResponse extends ResetOTPResponse {
  updated: number;
}

export interface EstimatePasswordParams {
  password: string;
  user_inputs?: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    email?: string;
    dateOfBirth?: string;
    otherInputs?: string[];
  };
}

export interface LoginViaGoogleParams {
  code: string;
  state?: string;
}

enum ID_TYPE {
  mobile = "mobile",
  email = "email"
}

enum OTP_MEDIUM {
  email = "email",
  sms = "sms"
}
