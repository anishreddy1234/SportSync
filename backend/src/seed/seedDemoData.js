import "dotenv/config";
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { Admin } from "../models/Admin.models.js";
import { Ground } from "../models/ground.models.js";

const img = (id) => ({
  url: `https://images.unsplash.com/${id}?w=1200&q=80`,
  publicId: `demo/${id}`,
});

const demoGrounds = [
  {
    adminUsername: "rohan_verma",
    adminPhone: "9876543210",
    name: "Elite Football Arena",
    description: "A well-maintained full-size football pitch with floodlights for evening matches, popular with local weekend leagues.",
    city: "Delhi",
    location: "Sector 18, Dwarka, New Delhi",
    sportTypes: ["Football"],
    basePrice: 1800,
    availableHours: { start: "09:00", end: "23:00", slotDuration: 60 },
    coverImage: img("photo-1579952363873-27f3bade9f55"),
    photos: [img("photo-1579952363873-27f3bade9f55"), img("photo-1624880357913-a8539238245b")],
    rules: "No metal studs allowed. Please vacate the ground 10 minutes before your slot ends for the next booking.",
  },
  {
    adminUsername: "karthik_reddy",
    adminPhone: "9845123456",
    name: "Ace Badminton Club",
    description: "Indoor, air-conditioned badminton courts with professional-grade flooring, a favorite with the Indiranagar crowd.",
    city: "Bengaluru",
    location: "100 Feet Road, Indiranagar, Bengaluru",
    sportTypes: ["Badminton"],
    basePrice: 600,
    availableHours: { start: "08:00", end: "22:00", slotDuration: 60 },
    coverImage: img("photo-1626224583764-f87db24ac4ea"),
    photos: [img("photo-1626224583764-f87db24ac4ea"), img("photo-1553778263-73a83bab9b0c")],
    rules: "Non-marking indoor shoes are mandatory. Rackets available for rent at the front desk.",
  },
  {
    adminUsername: "aditya_singh",
    adminPhone: "9721456780",
    name: "Victory Cricket Ground",
    description: "A regulation-size cricket ground with a well-kept turf pitch and practice nets, a favorite for weekend tape-ball and hard-ball matches.",
    city: "Lucknow",
    location: "Gomti Nagar, Lucknow",
    sportTypes: ["Cricket"],
    basePrice: 1500,
    availableHours: { start: "07:00", end: "22:00", slotDuration: 90 },
    coverImage: img("photo-1531415074968-036ba1b575da"),
    photos: [img("photo-1531415074968-036ba1b575da"), img("photo-1522778119026-d647f0596c20")],
    rules: "Only tennis/tape balls permitted before 5 PM. Hard-ball matches require prior admin approval.",
  },
  {
    adminUsername: "rahul_deshmukh",
    adminPhone: "9022334455",
    name: "Urban Turf",
    description: "A modern indoor futsal court with synthetic turf and rebound boards, right in the heart of Andheri.",
    city: "Mumbai",
    location: "Andheri Sports Complex Road, Andheri West, Mumbai",
    sportTypes: ["Football", "Futsal"],
    basePrice: 2000,
    availableHours: { start: "10:00", end: "23:00", slotDuration: 60 },
    coverImage: img("photo-1546519638-68e109498ffc"),
    photos: [img("photo-1546519638-68e109498ffc"), img("photo-1579952363873-27f3bade9f55")],
    rules: "Flat-soled futsal shoes only, no studs. Maximum 10 players per booking.",
  },
  {
    adminUsername: "sandeep_rao",
    adminPhone: "9490123456",
    name: "Prime Tennis Court",
    description: "Two well-lit hard courts available for singles or doubles, with a small seating area for spectators.",
    city: "Hyderabad",
    location: "Banjara Hills, Hyderabad",
    sportTypes: ["Tennis"],
    basePrice: 800,
    availableHours: { start: "06:00", end: "21:00", slotDuration: 60 },
    coverImage: img("photo-1554068865-24cecd4e34b8"),
    photos: [img("photo-1554068865-24cecd4e34b8"), img("photo-1553778263-73a83bab9b0c")],
    rules: "Court shoes required to protect the surface. Coaching sessions must be booked a day in advance.",
  },
  {
    adminUsername: "vikram_tiwari",
    adminPhone: "9012345678",
    name: "Champions Sports Hub",
    description: "A multi-purpose sports complex with a cricket ground and an adjoining football pitch, serving the Civil Lines area.",
    city: "Prayagraj",
    location: "Civil Lines, Prayagraj",
    sportTypes: ["Cricket", "Football"],
    basePrice: 1600,
    availableHours: { start: "08:00", end: "23:00", slotDuration: 60 },
    coverImage: img("photo-1624880357913-a8539238245b"),
    photos: [img("photo-1624880357913-a8539238245b"), img("photo-1531415074968-036ba1b575da"), img("photo-1522778119026-d647f0596c20")],
    rules: "Advance booking required for weekend slots. Floodlit night games available until 11 PM.",
  },
];

const DEMO_ADMIN_PASSWORD = "Demo@1234";

async function seed() {
  await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

  const existingGrounds = await Ground.countDocuments();
  if (existingGrounds > 0) {
    console.log(`Skipping seed: ${existingGrounds} ground(s) already exist in the database.`);
    await mongoose.disconnect();
    return;
  }

  console.log("Seeding demo grounds...\n");

  for (const entry of demoGrounds) {
    const admin = await Admin.create({
      username: entry.adminUsername,
      phoneNumber: entry.adminPhone,
      password: DEMO_ADMIN_PASSWORD,
    });

    const ground = await Ground.create({
      name: entry.name,
      owner: admin._id,
      description: entry.description,
      city: entry.city,
      coverImage: entry.coverImage,
      sportTypes: entry.sportTypes,
      location: entry.location,
      basePrice: entry.basePrice,
      availableHours: entry.availableHours,
      photos: entry.photos,
      rules: entry.rules,
    });

    admin.ground = ground._id;
    await admin.save();

    console.log(`✅ ${ground.name} (${entry.city}) — admin login: ${entry.adminUsername} / ${DEMO_ADMIN_PASSWORD}`);
  }

  console.log(`\nDone. Seeded ${demoGrounds.length} grounds and ${demoGrounds.length} admin accounts.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
