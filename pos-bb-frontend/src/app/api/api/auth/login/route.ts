import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators/auth";
import { success, error, validationError } from "@/lib/response";
import { verifyPassword } from "@/lib/auth/password";
import { generateAccessToken } from "@/lib/auth/jwt";
import { createAuditLog, getClientInfo } from "@/lib/audit/create-log";

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Mengotentikasi pengguna menggunakan email dan password, mengembalikan token akses JWT.
 *     tags:
 *       - Auth
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLoginInput'
 *     responses:
 *       200:
 *         description: Berhasil login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AuthLoginResponse'
 *       400:
 *         description: Validasi gagal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Email atau password salah
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return validationError(result.error.flatten());
    }

    const user = await prisma.user.findUnique({
      where: {
        email: result.data.email,
      },
    });

    if (!user) {
      return error("Invalid email or password", 401);
    }

    const isValid = await verifyPassword(
      result.data.password,
      user.password
    );

    if (!isValid) {
      return error("Invalid email or password", 401);
    }

    const token = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const { ipAddress, userAgent } = getClientInfo(request);
    await createAuditLog({
      userId: user.id,
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
      newData: { email: user.email, role: user.role },
      ipAddress,
      userAgent,
    });

    return success({
      accessToken: token,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (err) {
    console.error(err);
    return error("Internal Server Error");
  }
}