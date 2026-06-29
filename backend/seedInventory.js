const mongoose = require('mongoose');
const Inventory = require('./models/Inventory');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/salon_pos';

const items = [
  // ── SERVICES ─────────────────────────────────────────────────────────────
  { name: "Manicure",                       price: 250,   category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 0  },
  { name: "GEL",                            price: 500,   category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 0  },
  { name: "Human-hair (interlocking)",      price: 10000, category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 0  },
  { name: "Human-hair (twist)",             price: 5000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 0  },
  { name: "Pedicure and GEL",              price: 1300,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 40 },
  { name: "Tips and Builder",               price: 1500,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 40 },
  { name: "Creatives Acrylics",            price: 3000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 40 },
  { name: "Creatives GumGel",              price: 2500,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 40 },
  { name: "Creatives Tips Complex Design", price: 2000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 40 },
  { name: "Creatives Tips Simple Design",  price: 1800,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 40 },
  { name: "Overlay Acrylic",               price: 2000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 45 },
  { name: "Overlay GumGel",               price: 1500,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 45 },
  { name: "Tips Acrylic",                  price: 2500,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 40 },
  { name: "Tips GumGel",                   price: 2000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 40 },
  { name: "Builder Tips",                  price: 1500,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 45 },
  { name: "Undo",                          price: 50,    category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 0  },
  { name: "Stitch Lines",                  price: 1200,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 50 },
  { name: "Passion Twist",                 price: 1800,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 50 },
  { name: "Natural Twist",                price: 1800,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 50 },
  { name: "Spring Twist",                  price: 1500,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 50 },
  { name: "Wash TT",                       price: 500,   category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 40 },
  { name: "Wash",                          price: 300,   category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 40 },
  { name: "Straighten",                    price: 150,   category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 40 },
  { name: "Lemonade Braids",              price: 1500,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 50 },
  { name: "Twist",                         price: 1500,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 50 },
  { name: "BOH Braids",                    price: 1500,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 50 },
  { name: "Knotless",                      price: 1200,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 50 },
  { name: "Lines Braids",                  price: 1200,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 50 },
  { name: "Lines",                         price: 1100,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 50 },
  { name: "Lines (Back to School)",        price: 500,   category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 50 },
  { name: "Half/Facials",                  price: 1000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 40 },
  { name: "Quoval (Square + Oval)",        price: 1500,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 45, description: "Square shape with slightly rounded edges" },
  { name: "Square",                        price: 2000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 45, description: "Straight sides with sharp corners" },
  { name: "Oval",                          price: 2000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 45, description: "Soft, curved edges" },
  { name: "Flare (Duck Nails)",           price: 2000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 45, description: "Wide at the tip, flaring out like a duck's foot" },
  { name: "Edge",                          price: 2000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 45, description: "Angled tip that forms a ridge along the center" },
  { name: "Lipstick",                      price: 2000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 45, description: "Slanted tip resembling the cut of a lipstick bullet" },
  { name: "Round",                         price: 2000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 45, description: "Soft, curved edges" },
  { name: "Coffin / Ballerina",           price: 2000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 45, description: "Long with a flat, squared-off tip" },
  { name: "Stiletto",                      price: 2000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 45, description: "Long and very sharp-pointed" },
  { name: "Henna",                         price: 500,   category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 16 },
  { name: "Retie / Half",                 price: 1000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 50 },
  { name: "Hinna Black",                   price: 350,   category: "service", isTaxable: false, commissionType: 'fixed',      commissionValue: 80  },
  { name: "Dye",                           price: 2500,  category: "service", isTaxable: false, commissionType: 'fixed',      commissionValue: 200 },
  { name: "Treatment",                     price: 500,   category: "service", isTaxable: false, commissionType: 'fixed',      commissionValue: 200 },
  { name: "Full Facials",                 price: 1500,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 40 },
  { name: "Braids",                        price: 1500,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 50 },
  { name: "Sisterlocks Installation",     price: 10000, category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 50 },
  { name: "Deep Tissue",                  price: 3000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 0  },
  { name: "New Installation",             price: 10000, category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 50 },
  { name: "Twist Outs",                    price: 1000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 50 },
  { name: "Builder Gel",                  price: 1000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 45 },
  { name: "Retie",                         price: 2000,  category: "service", isTaxable: false, commissionType: 'percentage', commissionValue: 50 },

  // ── PHYSICAL PRODUCTS (not commissionable) ────────────────────────────────
  { name: "Human Hair 100g", price: 10000, category: "product", stock: 33,  isTaxable: true, commissionType: 'percentage', commissionValue: 0 },
  { name: "Human Hair 50g",  price: 5000,  category: "product", stock: 6,   isTaxable: true, commissionType: 'percentage', commissionValue: 0 },
  { name: "Hot Oil",         price: 400,   category: "product", stock: 142, isTaxable: true, commissionType: 'percentage', commissionValue: 0 },
  { name: "Cantu Mousse",    price: 1000,  category: "product", stock: 21,  isTaxable: true, commissionType: 'percentage', commissionValue: 0 },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected\n');

  let updated = 0;
  let inserted = 0;

  for (const item of items) {
    const result = await Inventory.findOneAndUpdate(
      { name: item.name },
      { $set: item },
      { upsert: true, returnDocument: 'after' }
    );

    // If _id was just created, it's an insert; otherwise update
    if (result.createdAt && (Date.now() - new Date(result.createdAt).getTime()) < 3000) {
      console.log(`  INSERT  ${item.name} — KSh ${item.price} | Commission: ${item.commissionType === 'fixed' ? 'KSh ' + item.commissionValue + ' fixed' : item.commissionValue + '%'}`);
      inserted++;
    } else {
      console.log(`  UPSERT  ${item.name} — commission → ${item.commissionType === 'fixed' ? 'KSh ' + item.commissionValue + ' fixed' : item.commissionValue + '%'}`);
      updated++;
    }
  }

  console.log(`\n✓ Done — ${inserted} inserted, ${updated} updated/upserted`);
  await mongoose.disconnect();
}

seed().catch(console.error);
