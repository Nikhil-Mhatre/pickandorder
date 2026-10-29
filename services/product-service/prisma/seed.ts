import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Nordic Oak Dining Table",
    description: "A clean-lined dining table made for everyday meals and weekend gatherings.",
    price: "24999.00",
    currency: "INR",
    category: "Tables",
    material: "Oak",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    name: "Luna Three-Seater Sofa",
    description: "A comfortable three-seater sofa with neutral upholstery and a solid frame.",
    price: "42999.00",
    currency: "INR",
    category: "Sofas",
    material: "Fabric",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    name: "Mira Upholstered Queen Bed",
    description: "A queen-size bed with a padded headboard and understated styling.",
    price: "35999.00",
    currency: "INR",
    category: "Beds",
    material: "Engineered Wood",
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    name: "Arlo Lounge Chair",
    description: "An accent chair designed for reading corners and relaxed living spaces.",
    price: "12999.00",
    currency: "INR",
    category: "Chairs",
    material: "Solid Wood",
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    name: "Cove Wooden Coffee Table",
    description: "A compact coffee table with a spacious top for living room essentials.",
    price: "8999.00",
    currency: "INR",
    category: "Tables",
    material: "Sheesham Wood",
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    name: "Forma Six-Shelf Bookcase",
    description: "An open bookcase for books, plants, framed photos, and display pieces.",
    price: "11499.00",
    currency: "INR",
    category: "Storage",
    material: "Engineered Wood",
  },
  {
    id: "10000000-0000-4000-8000-000000000007",
    name: "Haven Two-Door Wardrobe",
    description: "A practical wardrobe with a simple silhouette and generous storage space.",
    price: "27999.00",
    currency: "INR",
    category: "Storage",
    material: "Engineered Wood",
  },
  {
    id: "10000000-0000-4000-8000-000000000008",
    name: "Ridge Writing Desk",
    description: "A minimal writing desk for a home office or dedicated study area.",
    price: "14999.00",
    currency: "INR",
    category: "Desks",
    material: "Mango Wood",
  },
  {
    id: "10000000-0000-4000-8000-000000000009",
    name: "Pebble Round Side Table",
    description: "A small side table that fits beside a sofa, armchair, or bed.",
    price: "4999.00",
    currency: "INR",
    category: "Tables",
    material: "Metal",
  },
  {
    id: "10000000-0000-4000-8000-000000000010",
    name: "Sol Dining Chair",
    description: "A supportive dining chair with a simple profile and durable finish.",
    price: "5499.00",
    currency: "INR",
    category: "Chairs",
    material: "Rubberwood",
  },
  {
    id: "10000000-0000-4000-8000-000000000011",
    name: "Arc Floor Lamp",
    description: "A floor lamp that adds warm ambient lighting to a reading or lounge area.",
    price: "6999.00",
    currency: "INR",
    category: "Lighting",
    material: "Metal",
  },
  {
    id: "10000000-0000-4000-8000-000000000012",
    name: "Tide Compact Shoe Cabinet",
    description: "A slim entryway cabinet to keep everyday footwear neatly stored.",
    price: "7999.00",
    currency: "INR",
    category: "Storage",
    material: "Engineered Wood",
  },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency,
        category: product.category,
        material: product.material,
        isActive: true,
      },
      create: product,
    });
  }

  console.log(`Seed complete: ${products.length} furniture products upserted.`);
}

main()
  .catch((error: unknown) => {
    console.error("Product seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
