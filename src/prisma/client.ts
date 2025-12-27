import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client';

let url: string;
if (process.env.NODE_ENV !== 'prod') {
	url = `${process.env.TEST_DB_URL}`;
} else {
	url = `${process.env.PROD_DB_URL}`;
}

const connectionString = url;

const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter, errorFormat: 'pretty' });
