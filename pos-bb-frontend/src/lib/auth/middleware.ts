import { verifyAccessToken, JWTPayload } from "./jwt";

/**
 * Extracts and verifies the access token from the Authorization header of a Request.
 * Expects header format: "Bearer <token>"
 * 
 * @param request - Request object.
 * @returns Decoded JWTPayload or null if unauthorized/invalid.
 */
export async function getAuthUser(request: Request): Promise<JWTPayload | null> {
  try {
    const authHeader = request.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.substring(7); // "Bearer " length is 7
    return await verifyAccessToken(token);
  } catch (err) {
    return null;
  }
}
