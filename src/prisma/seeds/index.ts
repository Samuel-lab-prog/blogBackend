import seedUsers from './users';
import seedPosts from './posts';

async function main() {
  await seedUsers();
  await seedPosts();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
