const mongoose = require('mongoose');
const Inventory = require('./models/Inventory');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/salon_pos';

const items = [
  // ── SERVICES 
  { name: "Manicure",                      price: 250,   category: "service", isTaxable: false },
  { name: "GEL",                           price: 500,   category: "service", isTaxable: false },
  { name: "Human-hair (interlocking)",     price: 10000, category: "service", isTaxable: false },
  { name: "Human-hair (twist)",            price: 5000,  category: "service", isTaxable: false },
  { name: "Pedicure and GEL",             price: 1300,  category: "service", isTaxable: false },
  { name: "Tips and Builder",              price: 1500,  category: "service", isTaxable: false },
  { name: "Creatives Acrylics",           price: 3000,  category: "service", isTaxable: false },
  { name: "Creatives GumGel",             price: 2500,  category: "service", isTaxable: false },
  { name: "Creatives Tips Complex Design",price: 2000,  category: "service", isTaxable: false },
  { name: "Creatives Tips Simple Design", price: 1800,  category: "service", isTaxable: false },
  { name: "Overlay Acrylic",              price: 2000,  category: "service", isTaxable: false },
  { name: "Overlay GumGel",              price: 1500,  category: "service", isTaxable: false },
  { name: "Tips Acrylic",                 price: 2500,  category: "service", isTaxable: false },
  { name: "Tips GumGel",                  price: 2000,  category: "service", isTaxable: false },
  { name: "Builder Tips",                 price: 1500,  category: "service", isTaxable: false },
  { name: "Undo",                         price: 50,    category: "service", isTaxable: false },
  { name: "Stitch Lines",                 price: 1200,  category: "service", isTaxable: false },
  { name: "Passion Twist",                price: 1800,  category: "service", isTaxable: false },
  { name: "Natural Twist",               price: 1800,  category: "service", isTaxable: false },
  { name: "Spring Twist",                 price: 1500,  category: "service", isTaxable: false },
  { name: "Wash TT",                      price: 500,   category: "service", isTaxable: false },
  { name: "Wash",                         price: 300,   category: "service", isTaxable: false },
  { name: "Straighten",                   price: 150,   category: "service", isTaxable: false },
  { name: "Lemonade Braids",             price: 1500,  category: "service", isTaxable: false },
  { name: "Twist",                        price: 1500,  category: "service", isTaxable: false },
  { name: "BOH Braids",                   price: 1500,  category: "service", isTaxable: false },
  { name: "Knotless",                     price: 1200,  category: "service", isTaxable: false },
  { name: "Lines Braids",                 price: 1200,  category: "service", isTaxable: false },
  { name: "Lines",                        price: 1100,  category: "service", isTaxable: false },
  { name: "Lines (Back to School)",       price: 500,   category: "service", isTaxable: false },
  { name: "Half/Facials",                 price: 1000,  category: "service", isTaxable: false },
  { name: "Quoval (Square + Oval)",       price: 1500,  category: "service", isTaxable: false, description: "Square shape with slightly rounded edges" },
  { name: "Square",                       price: 2000,  category: "service", isTaxable: false, description: "Straight sides with sharp corners" },
  { name: "Oval",                         price: 2000,  category: "service", isTaxable: false, description: "Soft, curved edges" },
  { name: "Flare (Duck Nails)",          price: 2000,  category: "service", isTaxable: false, description: "Wide at the tip, flaring out like a duck's foot" },
  { name: "Edge",                         price: 2000,  category: "service", isTaxable: false, description: "Angled tip that forms a ridge along the center" },
  { name: "Lipstick",                     price: 2000,  category: "service", isTaxable: false, description: "Slanted tip resembling the cut of a lipstick bullet" },
  { name: "Round",                        price: 2000,  category: "service", isTaxable: false, description: "Soft, curved edges" },
  { name: "Coffin / Ballerina",          price: 2000,  category: "service", isTaxable: false, description: "Long with a flat, squared-off tip" },
  { name: "Stiletto",                     price: 2000,  category: "service", isTaxable: false, description: "Long and very sharp-pointed" },
  { name: "Henna",                        price: 500,   category: "service", isTaxable: false },
  { name: "Retie / Half",                price: 1000,  category: "service", isTaxable: false },
  { name: "Hinna Black",                  price: 350,   category: "service", isTaxable: false },
  { name: "Dye",                          price: 2500,  category: "service", isTaxable: false },
  { name: "Treatment",                    price: 500,   category: "service", isTaxable: false },
  { name: "Full Facials",                price: 1500,  category: "service", isTaxable: false },
  { name: "Braids",                       price: 1500,  category: "service", isTaxable: false },
  { name: "Sisterlocks Installation",    price: 10000, category: "service", isTaxable: false },
  { name: "Deep Tissue",                 price: 3000,  category: "service", isTaxable: false },
  { name: "New Installation",            price: 10000, category: "service", isTaxable: false },
  { name: "Twist Outs",                   price: 1000,  category: "service", isTaxable: false },
  { name: "Builder Gel",                 price: 1000,  category: "service", isTaxable: false },
  { name: "Retie",                        price: 2000,  category: "service", isTaxable: false },

  // ── PHYSICAL PRODUCTS (stock tracked, taxable) ────────────────────────
  { name: "Human Hair 100g", price: 10000, category: "product", stock: 33,  isTaxable: true },
  { name: "Human Hair 50g",  price: 5000,  category: "product", stock: 6,   isTaxable: true },
  { name: "Hot Oil",         price: 400,   category: "product", stock: 142, isTaxable: true },
  { name: "Cantu Mousse",    price: 1000,  category: "product", stock: 21,  isTaxable: true },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected\n');

  let added = 0;
  let skipped = 0;

  for (const item of items) {
    const exists = await Inventory.findOne({ name: item.name });
    if (exists) {
      console.log(`  SKIP   ${item.name}`);
      skipped++;
    } else {
      await Inventory.create(item);
      console.log(`  ADD    ${item.name} — KSh ${item.price}`);
      added++;
    }
  }

  console.log(`\n✓ Done — ${added} added, ${skipped} skipped`);
  await mongoose.disconnect();
}

seed().catch(console.error);
