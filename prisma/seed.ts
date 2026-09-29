import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/sumiden?schema=public',
});
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  console.log('🌱 Seeding database...');

  const speaker = await prisma.camera.upsert({
    where: { cameraIp: '172.16.32.155' },
    update: {
      name: 'Speaker 1',
      port: 80,
      protocol: 'http',
      username: 'root',
      password: 'fsci873T',
      clip: 0, // 0 = "Speaker Sound for AI Camera" (topmost clip)
      volume: 100,
      repeat: 0,
      audiodeviceid: 0,
      audiooutputid: 0,
      isActive: true,
    },
    create: {
      cameraId: 'CAM-0001',
      name: 'Speaker 1',
      cameraIp: '172.16.32.155',
      port: 80,
      protocol: 'http',
      username: 'root',
      password: 'fsci873T',
      clip: 0, // 0 = "Speaker Sound for AI Camera" (topmost clip)
      volume: 100,
      repeat: 0,
      audiodeviceid: 0,
      audiooutputid: 0,
      isActive: true,
    },
  });

  console.log(`✅ Seeded speaker: ${speaker.cameraId} [${speaker.name}] (${speaker.cameraIp})`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
