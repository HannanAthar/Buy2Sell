// MongoDB Cleanup Script
// This script drops legacy collections that are no longer used in the custom clothing studio pivot.
// Usage: Run this script directly from the MongoDB shell (mongosh) or wrap it in a Node script if preferred.

use('buy2sell'); // Replace 'buy2sell' with your actual database name if different

print("Starting custom clothing platform database cleanup...");

const collectionsToDrop = [
  "designers",
  "resellers",
  "rentals",              // Drop if rentals were a separate collection
  "rentalhistories",      // Ensure rent histories are purged
  "designerproducts",     // If products were segregated
  "resellerproducts"      // If products were segregated
];

let droppedCount = 0;

collectionsToDrop.forEach(coll => {
  const collectionExists = db.getCollectionNames().includes(coll);
  if (collectionExists) {
    db.getCollection(coll).drop();
    print(`Dropped collection: ${coll}`);
    droppedCount++;
  } else {
    print(`Collection skipped (does not exist): ${coll}`);
  }
});

print(`Cleanup complete. Dropped ${droppedCount} legacy collections.`);
