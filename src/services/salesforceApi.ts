// Salesforce API Service
const rawSiteUrl = import.meta.env.VITE_SALESFORCE_SITE_URL?.trim() || ''
const rawSitePath = import.meta.env.VITE_SALESFORCE_SITE_PATH?.trim() || '/Arelia'

const BASE_URL = rawSiteUrl.replace(/\/+$/, '')
const SITE_PATH = rawSitePath
  ? `/${rawSitePath.replace(/^\/+|\/+$/g, '')}`
  : ''

const REGISTRATION_BASE_URL = `${BASE_URL}${SITE_PATH}/services/apexrest/registration`

async function parseResponse(response: Response) {
  const text = await response.text()

  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

function getMissingConfigMessage() {
  return 'Salesforce site URL is not configured. Set VITE_SALESFORCE_SITE_URL in your .env.local file.'
}

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
  if (!BASE_URL) {
    return {
      success: false,
      message: getMissingConfigMessage(),
    }
  }

  try {
    const response = await fetch(
      `${REGISTRATION_BASE_URL}/lead`,
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
      const errorData = await parseResponse(response);
      return {
        success: false,
        message: errorData.message || "Failed to register lead",
      };
    }

    const data = await parseResponse(response);

    return {
      success: data.success === true,
      message: data.message,
    };
  } catch (error) {
    console.error("Error registering lead:", error);
    return {
      success: false,
      message:
        error instanceof TypeError
          ? 'Could not reach Salesforce. Check the org URL, site path, CORS, and guest user API access.'
          : "An error occurred while registering. Please try again.",
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
  if (!BASE_URL) {
    return {
      success: false,
      message: getMissingConfigMessage(),
    }
  }

  try {
    const response = await fetch(
      `${REGISTRATION_BASE_URL}/otp`,
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
      const errorData = await parseResponse(response);
      return {
        success: false,
        message: errorData.message || "Failed to send OTP",
      };
    }

    const data = await parseResponse(response);

    return {
      success: response.status === 200,
      message: data.message,
    };
  } catch (error) {
    console.error("Error sending OTP:", error);
    return {
      success: false,
      message:
        error instanceof TypeError
          ? 'Could not reach Salesforce. Check the org URL, site path, CORS, and guest user API access.'
          : "An error occurred while sending OTP. Please try again.",
    };
  }
}

/**
 * Generates a random 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
