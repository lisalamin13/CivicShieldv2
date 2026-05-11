require('dotenv').config();
const mongoose = require('mongoose');

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'civicshield' });
  
  // Use the raw collection to bypass any Mongoose schema protections
  const db = mongoose.connection.db;
  const result = await db.collection('conversations').updateMany({}, { $unset: { message: "" } });
  
  console.log(`✅ RAW SCRUB COMPLETE: Removed "message" field from ${result.modifiedCount} documents.`);
  
  // Verify
  const remaining = await db.collection('conversations').find({ message: { $exists: true } }).toArray();
  console.log(`🔍 Verification: Found ${remaining.length} documents still containing plain text.`);
  
  process.exit();
}

cleanup().catch(err => {
  console.error('❌ Force cleanup failed:', err.message);
  process.exit(1);
});
