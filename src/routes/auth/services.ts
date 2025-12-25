import bcrypt from 'bcryptjs';
import { generateToken, verifyToken, throwUnauthorizedError } from '@utils';
import { selectUser } from '../users/repository';
import { type UserRow } from '../users/types';

export async function loginUser(
  email: string,
  password: string
): Promise<{ data: { id: number }; token: string }> {
  const user = await selectUser({ email });
  console.log('User found:', user);
  console.log('Password provided:', password);
  console.log('Stored hashed password:', user?.password);
  
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
    return await selectUser({ email: payload.email });
  } catch {
    return null;
  }
}
