import { prisma } from '../client.ts';

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD_HASH;

if (!adminEmail || !adminPassword) {
	throw new Error(
		'ADMIN_EMAIL or ADMIN_PASSWORD_HASH environment variables are not set',
	);
}
const data = [
	{
		email: adminEmail,
		password: adminPassword,
	},
];

export default function seedUsers() {
	for (const user of data) {
		prisma.user.upsert({
			where: { email: user.email },
			update: {},
			create: user,
		});
	}
}
