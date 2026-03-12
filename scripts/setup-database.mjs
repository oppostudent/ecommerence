import { execSync } from 'child_process';

console.log('Running Prisma generate...');
execSync('npx prisma generate', { stdio: 'inherit' });

console.log('Running Prisma db push...');
execSync('npx prisma db push', { stdio: 'inherit' });

console.log('Database setup complete!');
