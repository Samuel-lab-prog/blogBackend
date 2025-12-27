import seedUsers from './users';
import seedPosts from './posts';

async function seedAll() {
	console.log('🟢 Starting seeds...');

	await seedUsers();
	console.log('✅ Users seeded');

	await seedPosts();
	console.log('✅ Posts seeded');
}

seedAll()
	.then(() => {
		console.log('🎉 All seeds completed');
		process.exit(0);
	})
	.catch((e) => {
		console.error('❌ Seed failed', e);
		process.exit(1);
	});
