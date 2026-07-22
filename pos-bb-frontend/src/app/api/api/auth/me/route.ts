import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/response";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get Current Logged In User
 *     description: Mengambil data profil pengguna yang sedang login berdasarkan Bearer Token JWT.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data profil pengguna
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized (Token tidak valid atau tidak diberikan)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(request: Request) {
  try {
    const auth = request.headers.get("authorization");

    if (!auth?.startsWith("Bearer ")) {
      return error("Unauthorized", 401);
    }

    const token = auth.replace("Bearer ", "");

    const payload = (await verifyAccessToken(token)) as {
      id: number;
    };

    const user = await prisma.user.findUnique({
      where: {
        id: payload.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return error("User not found", 404);
    }

    return success(user);

  } catch (err) {
    return error("Unauthorized", 401);
  }
}