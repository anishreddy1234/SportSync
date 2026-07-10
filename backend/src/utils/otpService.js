import "dotenv/config";
import { Resend } from "resend";
import { ApiError } from "./ApiError.js";

const resend = new Resend(process.env.RESEND_API_KEY);

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp) => {
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Your OTP Code - SportSync",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>SportSync OTP Verification</h2>

          <p>Your OTP is:</p>

          <h1 style="
            background:#f4f4f4;
            padding:15px;
            text-align:center;
            letter-spacing:6px;">
            ${otp}
          </h1>

          <p>This OTP expires in 10 minutes.</p>
        </div>
      `,
    });

    console.log(`✅ OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Resend error:", error);
    throw new ApiError(500, "Failed to send OTP email");
  }
};

export { generateOTP, sendOTPEmail };