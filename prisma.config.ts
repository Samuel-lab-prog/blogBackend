import 'dotenv/config';
import { defineConfig } from 'prisma/config';

let url: string;
if (process.env.NODE_ENV === 'test') {
	url = process.env.TEST_DB_URL!;
} else {
	url = process.env.PROD_DB_URL!;
}

export default defineConfig({
	schema: 'src/prisma/schema.prisma',
	migrations: {
		path: 'src/prisma/migrations',
		seed: 'bun src/prisma/seeds/main.ts',
	},

	datasource: {
		url,
	},
});
