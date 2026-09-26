import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Notification } from '../models/Notification.model.js';
import { NotificationPreference } from '../models/NotificationPreference.model.js';
import { logger } from '../utils/logger.js';

/**
 * One-shot migration for notifications + preferences.
 *
 * Both are brand-new collections. No data to backfill. This script
 * creates the collections and applies their indexes — including the
 * TTL index that auto-deletes read notifications after 90 days.
 *
 * A note on the TTL index: it must be created exactly once with the
 * right options. Running `syncIndexes()` repeatedly is safe, but if
 * the index was ever created with different `expireAfterSeconds` or
 * `partialFilterExpression` options, Mongo refuses to modify it in
 * place and requires a drop + recreate. `syncIndexes()` handles this
 * correctly, which is why we call it rather than createIndex.
 *
 * Idempotent. Safe to re-run.
 *
 * Usage:
 *   npm run migrate:notifications -w server
 */
async function migrate() {
  console.log('🔧 Migrating for notifications...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected');

  console.log('   Syncing Notification indexes...');
  await Notification.syncIndexes();

  console.log('   Syncing NotificationPreference indexes...');
  await NotificationPreference.syncIndexes();

  const notificationCount = await Notification.countDocuments({});
  const preferenceCount = await NotificationPreference.countDocuments({});
  const unreadCount = await Notification.countDocuments({ read: false });

  console.log(`   Notifications: ${notificationCount} (${unreadCount} unread)`);
  console.log(`   Preferences rows: ${preferenceCount}`);

  const indexes = await Notification.collection.indexes();
  console.log('   Notification indexes:');
  for (const idx of indexes) {
    const extras: string[] = [];
    if ('expireAfterSeconds' in idx && idx.expireAfterSeconds !== undefined) {
      extras.push(`ttl=${idx.expireAfterSeconds}s`);
    }
    if ('partialFilterExpression' in idx && idx.partialFilterExpression) {
      extras.push('partial');
    }
    console.log(
      `     ${idx.name} ${JSON.stringify(idx.key)}${
        extras.length ? ` (${extras.join(', ')})` : ''
      }`
    );
  }

  console.log('🎉 Migration complete.');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(async (err) => {
  logger.error('Notifications migration failed', {
    err: err instanceof Error ? err.message : String(err),
  });
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});