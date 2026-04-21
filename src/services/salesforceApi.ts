// Salesforce API Service
const BASE_URL = "https://sprintpark--dev4.sandbox.my.site.com";

/**
 * Registers a lead in Salesforce
 */
export async function registerLead(
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  company: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(
      `${BASE_URL}/Arelia/services/apexrest/registration/lead`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          companyName: !company || company.trim() === '' ? "Self" : company,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || "Failed to register lead",
      };
    }

    const data = await response.json();

    return {
      success: data.success === true,
      message: data.message,
    };
  } catch (error) {
    console.error("Error registering lead:", error);
    return {
      success: false,
      message: "An error occurred while registering. Please try again.",
    };
  }
}

/**
 * Sends OTP to the email
 */
export async function sendOtp(
  email: string,
  otp: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(
      `${BASE_URL}/Arelia/services/apexrest/registration/otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || "Failed to send OTP",
      };
    }

    const data = await response.json();

    return {
      success: response.status === 200,
      message: data.message,
    };
  } catch (error) {
    console.error("Error sending OTP:", error);
    return {
      success: false,
      message: "An error occurred while sending OTP. Please try again.",
    };
  }
}

/**
 * Generates a random 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
