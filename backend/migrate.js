import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// Credentials now come from .env (which is gitignored) instead of being
// hardcoded in this file. Add these two lines to your .env before running:
//   SOURCE_MONGO_URI=mongodb://...ets_besvid_db?...
//   TARGET_MONGO_URI=mongodb://...ets_besvid?...
async function migrateData() {
  const sourceUri = process.env.SOURCE_MONGO_URI;
  const targetUri = process.env.TARGET_MONGO_URI;

  if (!sourceUri || !targetUri) {
    console.error('🚨 SOURCE_MONGO_URI and/or TARGET_MONGO_URI missing from .env — aborting.');
    process.exit(1);
  }

  const sourceClient = new MongoClient(sourceUri);
  const targetClient = new MongoClient(targetUri);

  try {
    await sourceClient.connect();
    await targetClient.connect();

    const sourceColl = sourceClient.db("ets_besvid_db").collection("productitems");
    const targetColl = targetClient.db("ets_besvid").collection("productitems");

    const documents = await sourceColl.find({}).toArray();
    if (documents.length > 0) {
      await targetColl.insertMany(documents, { ordered: false });
      console.log(`Successfully migrated ${documents.length} records.`);
    } else {
      console.log("No documents found to migrate.");
    }
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

migrateData();
