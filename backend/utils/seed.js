const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

const User     = require('../models/User');
const Product  = require('../models/Product');
const Employee = require('../models/Employee');

const products = [
  { name:'Biryani',              shortcut:'bn',    price:120, category:'Main Course', gstRate:0.05 },
  { name:'Chicken Curry',        shortcut:'ch',    price:150, category:'Main Course', gstRate:0.05 },
  { name:'Paneer Butter Masala', shortcut:'pbm',   price:160, category:'Main Course', gstRate:0.05 },
  { name:'Dal Tadka',            shortcut:'dal',   price:80,  category:'Main Course', gstRate:0.05 },
  { name:'Butter Roti',          shortcut:'roti',  price:20,  category:'Breads',      gstRate:0.05 },
  { name:'Naan',                 shortcut:'naan',  price:30,  category:'Breads',      gstRate:0.05 },
  { name:'Lassi',                shortcut:'lsi',   price:40,  category:'Beverages',   gstRate:0.12 },
  { name:'Mineral Water 500ml',  shortcut:'wtr',   price:20,  category:'Beverages',   gstRate:0.12 },
  { name:'Mango Juice',          shortcut:'mj',    price:60,  category:'Beverages',   gstRate:0.12 },
  { name:'Coca Cola 300ml',      shortcut:'coke',  price:40,  category:'Beverages',   gstRate:0.12 },
  { name:'Steamed Rice',         shortcut:'rice',  price:50,  category:'Sides',       gstRate:0.05 },
  { name:'Raita',                shortcut:'raita', price:30,  category:'Sides',       gstRate:0.05 },
  { name:'Gulab Jamun',          shortcut:'gj',    price:50,  category:'Desserts',    gstRate:0.05 },
  { name:'Ice Cream',            shortcut:'ic',    price:60,  category:'Desserts',    gstRate:0.05 },
  { name:'Veg Thali',            shortcut:'vt',    price:180, category:'Thali',       gstRate:0.05 },
  { name:'Non-Veg Thali',        shortcut:'nvt',   price:220, category:'Thali',       gstRate:0.05 },
];

const employees = [
  { name:'Arjun Sharma',    phone:'9876543210', email:'arjun.sharma@gmail.com',   address:'12, MG Road, Chennai',         role:'Manager',    department:'Operations',  salary:45000, joiningDate:'2022-03-15' },
  { name:'Priya Nair',      phone:'9123456780', email:'priya.nair@gmail.com',     address:'45, Anna Nagar, Chennai',      role:'Cashier',    department:'Billing',     salary:22000, joiningDate:'2022-06-01' },
  { name:'Ravi Kumar',      phone:'9988776655', email:'ravi.kumar@gmail.com',     address:'78, T Nagar, Chennai',         role:'Staff',      department:'Service',     salary:18000, joiningDate:'2023-01-10' },
  { name:'Meena Devi',      phone:'9345678901', email:'meena.devi@gmail.com',     address:'23, Adyar, Chennai',           role:'Worker',     department:'Kitchen',     salary:15000, joiningDate:'2023-03-22' },
  { name:'Karthik Raja',    phone:'9456789012', email:'karthik.raja@gmail.com',   address:'56, Velachery, Chennai',       role:'Supervisor', department:'Floor',       salary:30000, joiningDate:'2021-11-05' },
  { name:'Sunita Verma',    phone:'9567890123', email:'sunita.verma@gmail.com',   address:'89, Mylapore, Chennai',        role:'Cashier',    department:'Billing',     salary:22000, joiningDate:'2023-07-14' },
  { name:'Deepak Pillai',   phone:'9678901234', email:'deepak.pillai@gmail.com',  address:'34, Guindy, Chennai',          role:'Worker',     department:'Delivery',    salary:15000, joiningDate:'2023-09-01' },
  { name:'Ananya Singh',    phone:'9789012345', email:'ananya.singh@gmail.com',   address:'67, Nungambakkam, Chennai',    role:'Staff',      department:'Service',     salary:18000, joiningDate:'2024-01-15' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voice_billing');
  console.log('✅ Connected to MongoDB');

  await User.deleteMany({});
  await Product.deleteMany({});
  await Employee.deleteMany({});

  await User.create([
    { name:'Admin User',       email:'admin@billing.com',    password:'admin123',    role:'admin' },
    { name:'Billing Operator', email:'operator@billing.com', password:'operator123', role:'operator' }
  ]);
  console.log('✅ Users seeded');

  await Product.insertMany(products);
  console.log(`✅ ${products.length} products seeded`);

  await Employee.insertMany(employees);
  console.log(`✅ ${employees.length} employees seeded`);

  console.log('\n📋 Login credentials:');
  console.log('  Admin:    admin@billing.com    / admin123');
  console.log('  Operator: operator@billing.com / operator123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
