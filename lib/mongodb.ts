import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://manovmandal:qwerty123@test.kcd3ksw.mongodb.net/?retryWrites=true&w=majority&appName=test';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Delegation Schema
const DelegationSchema = new mongoose.Schema({
  userAddress: { type: String, required: true, unique: true },
  smartAccountAddress: { type: String, required: true },
  signature: { type: String, required: true },
  capabilities: [{ type: Object }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

export const Delegation = mongoose.models.Delegation || mongoose.model('Delegation', DelegationSchema);

// User Session Schema
const UserSessionSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  nonce: { type: String, required: true },
  chainId: { type: Number, required: true },
  isAuthenticated: { type: Boolean, default: false },
  lastLogin: { type: Date, default: Date.now },
});

export const UserSession = mongoose.models.UserSession || mongoose.model('UserSession', UserSessionSchema);
