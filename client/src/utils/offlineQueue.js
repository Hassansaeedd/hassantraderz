// client/src/utils/offlineQueue.js — IndexedDB offline queue for sales sync
import { openDB } from 'idb';
import { v4 as uuid } from 'uuid';

const DB_NAME    = 'mobileshop_offline';
const DB_VERSION = 1;
const STORE      = 'pending_sales';

const getDB = () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'offlineId' });
        store.createIndex('status', 'status');
      }
    },
  });

// Save a sale to IndexedDB when offline
export const queueSale = async (saleData) => {
  const db      = await getDB();
  const offlineId = uuid();
  await db.put(STORE, { ...saleData, offlineId, status: 'pending', createdAt: new Date().toISOString() });
  return offlineId;
};

// Get all pending sales
export const getPendingSales = async () => {
  const db = await getDB();
  return db.getAllFromIndex(STORE, 'status', 'pending');
};

// Mark a sale as synced
export const markSynced = async (offlineId) => {
  const db   = await getDB();
  const sale = await db.get(STORE, offlineId);
  if (sale) await db.put(STORE, { ...sale, status: 'synced', syncedAt: new Date().toISOString() });
};

// Remove synced sales older than 7 days
export const cleanSynced = async () => {
  const db    = await getDB();
  const all   = await db.getAll(STORE);
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const sale of all) {
    if (sale.status === 'synced' && new Date(sale.syncedAt) < cutoff) {
      await db.delete(STORE, sale.offlineId);
    }
  }
};

// Sync all pending sales — call this when coming back online
export const syncPendingSales = async (apiPost, onProgress) => {
  const pending = await getPendingSales();
  let synced = 0;
  for (const sale of pending) {
    try {
      await apiPost('/sales', sale);
      await markSynced(sale.offlineId);
      synced++;
      onProgress?.(synced, pending.length);
    } catch (err) {
      console.error('Failed to sync sale:', sale.offlineId, err);
    }
  }
  await cleanSynced();
  return { synced, total: pending.length };
};
