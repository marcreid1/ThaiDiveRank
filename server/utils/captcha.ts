/**
 * Utility functions for hCaptcha verification
 */

interface HCaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * Verify hCaptcha token with hCaptcha service
 * @param token - The captcha token from the client
 * @param secretKey - The hCaptcha secret key
 * @returns Promise<boolean> - Whether the captcha is valid
 */
export async function verifyCaptcha(token: string, secretKey?: string): Promise<boolean> {
  // In development, allow bypass if no secret key is provided
  if (!secretKey) {
    console.warn('[CAPTCHA] No secret key provided - bypassing verification in development');
    return true;
  }

  try {
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data: HCaptchaResponse = await response.json();
    
    if (!data.success) {
      console.error('[CAPTCHA] Verification failed:', data['error-codes']);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[CAPTCHA] Verification error:', error);
    return false;
  }
}