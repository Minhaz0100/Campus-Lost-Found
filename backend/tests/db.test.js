import test from 'node:test';
import assert from 'node:assert/strict';
import connectDB from '../src/config/db.js';

test('connectDB starts a local MongoDB instance when URI is missing', async () => {
  const originalUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;

  try {
    const connected = await connectDB();
    assert.equal(connected, true);
  } finally {
    if (originalUri !== undefined) {
      process.env.MONGODB_URI = originalUri;
    }
  }
});
