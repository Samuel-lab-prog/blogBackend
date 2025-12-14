import jwt from 'jsonwebtoken';

export interface payload {
  id: number;
  email: string;
}
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export function generateToken(userPayload: payload): string {
  const token = jwt.sign(userPayload, JWT_SECRET);
  return token;
}

export function verifyToken(token: string): payload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as payload;
  } catch {
    return null;
  }
}