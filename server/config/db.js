const dns = require('dns');
const mongoose = require('mongoose');

// Some networks/routers/VPNs/antivirus tools ship DNS resolvers that don't
// support the SRV + TXT record lookups an "mongodb+srv://" connection
// string needs, causing a "querySrv ECONNREFUSED" error even though the
// connection string itself is correct. Forcing Node to resolve through a
// public DNS server (Google, then Cloudflare as a fallback) sidesteps that
// without requiring any change to the machine's network settings.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('[MongoDB] Could not override DNS servers:', err.message);
}

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/payroll_management';
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`[MongoDB] Connection error: ${err.message}`);
    // Do not crash the whole process silently — surface a clear error so
    // ops/devs know the API is up but the database is unreachable.
    throw err;
  }
};

module.exports = connectDB;
