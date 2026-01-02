# Offline-First POS Billing System Upgrade

This document outlines the plan to upgrade the existing POS system to support offline-first operations, PWA, supplier management, barcode generation, and optimized keyboard/scanner POS mode.

## 1. Tech Stack Enhancements
- **IndexedDB**: Using `Dexie.js` for robust IndexedDB management.
- **PWA**: Using `next-pwa` for service worker and offline caching.
- **Barcode**: Using `jsbarcode` for SVG/Canvas barcode generation.
- **Keyboard Shortcuts**: Native React event listeners for global shortcut handling.

## 2. IndexedDB Schema Design (Dexie)
We will create a central `db.ts` to manage:
- **Products**: `_id, name, sku, barcode, price, stockQuantity, ...`
- **Sales**: `id, invoiceNumber, items, grandTotal, synced, offlineId, ...`
- **Suppliers**: `_id, name, phone, openingBalance, currentBalance, ...`
- **SupplierTransactions**: `id, supplierId, type (purchase/payment), amount, date, ...`
- **SyncQueue**: `id, type, data, timestamp` (for retry logic)
- **Metadata**: `key, value` (to store last invoice number, deviceId, etc.)

## 3. PWA Configuration
- Setup `next-pwa` in `next.config.ts`.
- Create `manifest.json` and icons.
- Implement a Service Worker that caches API routes (where appropriate) and static assets.

## 4. Supplier Management Module
- **New Page**: `/suppliers`
- **Features**: 
  - List/Search suppliers.
  - Detail view with transaction ledger.
  - Add Purchase/Payment transactions (offline-first).
  - Sync transaction history to MongoDB.

## 5. Barcode Generator System
- **Generator**: A utility to convert SKU/Product ID to Barcode.
- **Print Layout**: A clean CSS-based label layout for thermal labels (e.g., 50mm x 25mm or standard 80mm roll).
- **Scanner Integration**: Focus capture logic to ensure scanner input always hits the search field.

## 6. Invoice Number Generation
- **Format**: `YYYY/YYYY/INCREMENT`
- **Logic**:
  - Get current financial year (April to March).
  - Retrieve last increment from IndexedDB.
  - Increment and save back.
  - Device ID suffix for multi-device safety: `YYYY/YYYY/INCREMENT-DEVICEID`.

## 7. Sync Mechanism
- **Background Sync**: Triggered when `navigator.onLine` changes.
- **Conflict Resolution**: Last-write-wins for master data, Append-only for transactions.
- **Auto-Sync**: Periodic check for pending items in `SyncQueue`.

## 8. Development Phases
1. **Infrastructure**: Dexie setup & PWA config.
2. **Offline Master Data**: Sync products/suppliers to IndexedDB.
3. **Offline Billing**: Update POS to save to IndexedDB first.
4. **Supplier Module**: Create UI and offline ledger.
5. **Barcode & Scanner**: UI and keyboard handling.
6. **Sync & Polish**: Implement the sync loop and online/offline status UI.

## 9. Offline Testing Checklist
- [ ] Disable Internet (Airplane Mode)
- [ ] Search for products (should use IndexedDB)
- [ ] Add to cart and Checkout (verify IndexedDB "Sales" table)
- [ ] Verify Invoice number format: `2026/2027/0001-XXXX`
- [ ] Record a Supplier Payment offline
- [ ] Print dummy thermal receipt (verify it opens in new tab)
- [ ] Enable Internet
- [ ] Verify Auto-sync triggered (check SyncStore status)
- [ ] Verify Backend DB has the new records with matching `offlineId`
- [ ] Test Barcode Scanner (Scanner input should auto-focus search field)
