import { hashPassword, verifyPassword } from "../lib/auth/password";
import { generateAccessToken, verifyAccessToken } from "../lib/auth/jwt";
import { isAdmin, isOwner, isCashier, isMechanic } from "../lib/auth/roles";
import { getAuthUser } from "../lib/auth/middleware";
import assert from "assert";

async function runAuthTests() {
  console.log("=== Running AUTH Helpers Tests ===");

  // 1. Test Password hashing and verification
  const password = "mySecurePassword123";
  const hash = await hashPassword(password);
  assert(hash !== password, "Password hashing should not return plaintext password");
  assert(await verifyPassword(password, hash), "Password verification should pass for correct password");
  assert(!(await verifyPassword("wrongPassword", hash)), "Password verification should fail for wrong password");
  console.log("  ✓ Password hash & verify pass");

  // 2. Test JWT generation and verification
  const payload = {
    id: 42,
    role: "CASHIER",
    email: "cashier@pos.com"
  };
  const token = generateAccessToken(payload);
  assert(typeof token === "string", "Token must be a string");
  
  const decoded = await verifyAccessToken(token);
  assert(decoded !== null, "Decoded token should not be null");
  assert(decoded.id === payload.id, "Decoded id must match");
  assert(decoded.role === payload.role, "Decoded role must match");
  assert(decoded.email === payload.email, "Decoded email must match");

  const invalidDecoded = await verifyAccessToken("invalid.token.here");
  assert(invalidDecoded === null, "Decoding invalid token should return null");
  console.log("  ✓ JWT sign & verify pass");

  // 3. Test roles helpers
  assert(isAdmin("ADMIN"), "isAdmin('ADMIN') should return true");
  assert(!isAdmin("CASHIER"), "isAdmin('CASHIER') should return false");
  assert(isOwner("OWNER"), "isOwner('OWNER') should return true");
  assert(isCashier("CASHIER"), "isCashier('CASHIER') should return true");
  assert(isMechanic("MECHANIC"), "isMechanic('MECHANIC') should return true");
  console.log("  ✓ Role checkers pass");

  // 4. Test middleware getAuthUser helper
  const dummyRequest = new Request("http://localhost/api/test", {
    headers: {
      authorization: `Bearer ${token}`
    }
  });
  const authedUser = await getAuthUser(dummyRequest);
  assert(authedUser !== null, "getAuthUser should return parsed payload");
  assert(authedUser.id === 42, "getAuthUser payload should have correct id");

  const noHeaderRequest = new Request("http://localhost/api/test");
  assert((await getAuthUser(noHeaderRequest)) === null, "getAuthUser should return null when authorization header is missing");

  const wrongHeaderRequest = new Request("http://localhost/api/test", {
    headers: {
      authorization: "Bearer wrongToken"
    }
  });
  assert((await getAuthUser(wrongHeaderRequest)) === null, "getAuthUser should return null when token is invalid");
  console.log("  ✓ Middleware request parser passes");

  console.log("\nAll auth helper tests passed successfully!");
}

runAuthTests().catch((err) => {
  console.error("Auth tests failed:", err);
  process.exit(1);
});
