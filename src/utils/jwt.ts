import jwt from 'jsonwebtoken';

export interface payload {
	id: number;
	email: string;
}
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
	throw new Error('JWT_SECRET is not defined in environment variables');
}

export function generateToken(userPayload: payload): string {
	const token = jwt.sign(userPayload, JWT_SECRET!);
	return token;
}

export function verifyToken(token: string): payload | null {
	try {
		return jwt.verify(token, JWT_SECRET!) as payload;
	} catch {
		return null;
	}
}
