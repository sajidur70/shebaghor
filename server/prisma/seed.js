import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = ["Electrician", "Plumber", "AC Technician", "Tutor"];
const WORK_DAYS = [6, 0, 1, 2, 3, 4]; // Saturday–Thursday. Friday (5) off.

const PROVIDERS = [
  {
    name: "Rahim Uddin",
    email: "rahim@shebaghor.dev",
    area: "Mirpur",
    approved: true,
    bio: "Licensed electrician, 10 years of experience.",
    services: [
      {
        title: "Fan & light repair",
        category: "Electrician",
        price: 500,
        durationMin: 60,
        description: "Repair or replace ceiling fans, lights and switches.",
      },
      {
        title: "House wiring check",
        category: "Electrician",
        price: 1200,
        durationMin: 90,
        description: "Full safety check of your home wiring and DB box.",
      },
    ],
  },
  {
    name: "Jamal Hossain",
    email: "jamal@shebaghor.dev",
    area: "Uttara",
    approved: true,
    bio: "Plumber for kitchens and bathrooms.",
    services: [
      {
        title: "Leaking tap & pipe fix",
        category: "Plumber",
        price: 400,
        durationMin: 60,
        description: "Fix leaking taps, pipes and basin connections.",
      },
    ],
  },
  {
    name: "Tanvir Ahmed",
    email: "tanvir@shebaghor.dev",
    area: "Gulshan",
    approved: true,
    bio: "AC servicing for all brands.",
    services: [
      {
        title: "AC full servicing",
        category: "AC Technician",
        price: 1500,
        durationMin: 90,
        description: "Cleaning, gas pressure check and performance test.",
      },
    ],
  },
  {
    name: "Salma Begum",
    email: "salma@shebaghor.dev",
    area: "Dhanmondi",
    approved: true,
    bio: "Math and physics tutor for SSC/HSC.",
    services: [
      {
        title: "SSC math tutoring",
        category: "Tutor",
        price: 800,
        durationMin: 60,
        description: "One-to-one math class at your home.",
      },
    ],
  },
  {
    // Not approved: must NOT appear in search until the admin approves.
    name: "Karim Mia",
    email: "pending@shebaghor.dev",
    area: "Banani",
    approved: false,
    bio: "New electrician waiting for approval.",
    services: [
      {
        title: "Switchboard installation",
        category: "Electrician",
        price: 700,
        durationMin: 60,
        description: "Install new switchboards and sockets.",
      },
    ],
  },
];

async function main() {
  // 1. Wipe. Children first, because of foreign keys.
  await prisma.review.deleteMany(); // reviews point at bookings, so they go first

  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.service.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. Same password for every demo account.
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.create({
    data: {
      name: "ShebaGhor Admin",
      email: "admin@shebaghor.dev",
      passwordHash,
      role: "ADMIN",
    },
  });
  await prisma.user.create({
    data: {
      name: "Nadia Islam",
      email: "customer@shebaghor.dev",
      passwordHash,
      role: "CUSTOMER",
      phone: "01711000000",
    },
  });

  // 3. Categories
  const categoryIds = {};
  for (const name of CATEGORIES) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const category = await prisma.category.create({ data: { name, slug } });
    categoryIds[name] = category.id;
  }

  // 4. Providers. Nested create = user + profile + hours + services in one transaction.
  for (const p of PROVIDERS) {
    await prisma.user.create({
      data: {
        name: p.name,
        email: p.email,
        passwordHash,
        role: "PROVIDER",
        phone: "01811000000",
        provider: {
          create: {
            area: p.area,
            bio: p.bio,
            approved: p.approved,
            availability: {
              create: WORK_DAYS.map((weekday) => ({
                weekday,
                startMin: 9 * 60,
                endMin: 18 * 60,
              })),
            },
            services: {
              create: p.services.map((s) => ({
                title: s.title,
                description: s.description,
                price: s.price,
                durationMin: s.durationMin,
                area: p.area,
                category: { connect: { id: categoryIds[s.category] } },
              })),
            },
          },
        },
      },
    });
  }
  // ── Demo jobs so "Mark complete" and "Review" can be tested right away ──
  const nadia = await prisma.user.findUnique({
    where: { email: "customer@shebaghor.dev" },
  });
  const rahim = await prisma.providerProfile.findFirst({
    where: { user: { email: "rahim@shebaghor.dev" } },
    include: { services: true },
  });
  const fan = rahim.services.find((s) => s.title === "Fan & light repair");
  const hoursAgo = (h) => new Date(Date.now() - h * 3_600_000);

  // 1) Yesterday, paid and CONFIRMED → Rahim can "Mark complete", then Nadia can review it.
  await prisma.booking.create({
    data: {
      customerId: nadia.id,
      providerId: rahim.id,
      serviceId: fan.id,
      startAt: hoursAgo(26),
      endAt: hoursAgo(25),
      price: fan.price,
      address: "House 12, Road 3, Mirpur 10",
      status: "CONFIRMED",
      payment: {
        create: {
          tranId: "SEED-1",
          amount: fan.price,
          status: "PAID",
          valId: "SEED",
        },
      },
    },
  });

  // 2) Last week, COMPLETED and already reviewed → Rahim starts with ★5.0 (1).
  const oldJob = await prisma.booking.create({
    data: {
      customerId: nadia.id,
      providerId: rahim.id,
      serviceId: fan.id,
      startAt: hoursAgo(24 * 7),
      endAt: hoursAgo(24 * 7 - 1),
      price: fan.price,
      address: "House 12, Road 3, Mirpur 10",
      status: "COMPLETED",
      payment: {
        create: {
          tranId: "SEED-2",
          amount: fan.price,
          status: "PAID",
          valId: "SEED",
        },
      },
    },
  });
  await prisma.review.create({
    data: {
      bookingId: oldJob.id,
      customerId: nadia.id,
      providerId: rahim.id,
      rating: 5,
      comment: "Fixed my fan in 20 minutes. Very polite!",
    },
  });
  await prisma.providerProfile.update({
    where: { id: rahim.id },
    data: { ratingAvg: 5, ratingCount: 1 },
  });
  console.log("🌱 Seed complete. All demo passwords: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
