import { db } from './db';

/**
 * Generates an invoice number in the format: YYYY/YYYY/INCREMENT
 * Example: 2026/2027/0001
 * Resets every financial year (April 1st).
 */
export async function generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed, 3 = April

    let startYear, endYear;
    if (currentMonth >= 3) { // April or later
        startYear = currentYear;
        endYear = currentYear + 1;
    } else { // Jan, Feb, Mar
        startYear = currentYear - 1;
        endYear = currentYear;
    }

    const yearPrefix = `${startYear}/${endYear}`;

    // Get last invoice number from settings
    const lastInvoiceSetting = await db.settings.get(`last_invoice_${yearPrefix}`);
    let nextIncrement = 1;

    if (lastInvoiceSetting) {
        nextIncrement = lastInvoiceSetting.value + 1;
    }

    // Save the new increment
    await db.settings.put({ key: `last_invoice_${yearPrefix}`, value: nextIncrement });

    // Format: YYYY/YYYY/0001
    const paddedIncrement = nextIncrement.toString().padStart(4, '0');

    // Add a device ID for safety if available
    const deviceId = await getDeviceId();

    return `${yearPrefix}/${paddedIncrement}-${deviceId}`;
}

async function getDeviceId(): Promise<string> {
    let deviceIdSetting = await db.settings.get('device_id');
    if (!deviceIdSetting) {
        const newId = Math.random().toString(36).substring(2, 6).toUpperCase();
        await db.settings.put({ key: 'device_id', value: newId });
        return newId;
    }
    return deviceIdSetting.value;
}
