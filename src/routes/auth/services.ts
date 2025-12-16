import bcrypt from 'bcryptjs';
import { generateToken, verifyToken } from '../../utils/jwt.ts';
import { selectUserByEmail } from '../users/models.ts';
import { throwUnauthorizedError } from '../../utils/AppError.ts';
import type { UserRow } from '../users/types.ts';

export async function login(
  email: string,
  password: string
): Promise<{ data: { id: number }; token: string }> {
  const user = await selectUserByEmail(email);

  if (user && (await bcrypt.compare(password, user.password))) {
    return {
      data: { id: user.id },
      token: generateToken({
        id: user.id,
        email: user.email,
      }),
    };
  }
  throwUnauthorizedError('Invalid email or password');
}

export async function authenticate(token: string): Promise<UserRow | null> {
  try {
    const payload = verifyToken(token);
    if (!payload || !payload.email) {
      return null;
    }
    return await selectUserByEmail(payload.email);
  } catch {
    return null;
  }
}
