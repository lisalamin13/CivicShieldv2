const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  try {
    // Override DNS servers to Google & Cloudflare to resolve querySrv (SRV) issues on local networks
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (dnsErr) {
      console.warn('DNS server override failed, using default system DNS:', dnsErr.message);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'civicshield',
    });
    console.log(` MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
