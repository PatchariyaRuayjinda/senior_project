import { ApplicationError } from '../../shared/domain/errors';
import { calendarDate } from './dates';

export interface LotFields {
    productId: string;
    lotNumber?: string;
    manufacturedAt?: string;
    expiresAt?: string;
}
export function lotFields(input: LotFields, tracksExpiry: boolean) {
    const manufacturedAt = calendarDate(input.manufacturedAt);
    const expiresAt = calendarDate(input.expiresAt);
    if (tracksExpiry && !expiresAt)
        throw new ApplicationError(
            'validation',
            'LOT_EXPIRY_REQUIRED',
            'An expiry date is required for this product.',
        );
    if (manufacturedAt && expiresAt && expiresAt < manufacturedAt) {
        throw new ApplicationError(
            'validation',
            'INVALID_DATE_ORDER',
            'Expiry cannot precede manufacture.',
        );
    }
    const lotNumber = input.lotNumber?.trim();
    return {
        productId: input.productId,
        ...(lotNumber ? { lotNumber } : {}),
        ...(manufacturedAt ? { manufacturedAt } : {}),
        ...(expiresAt ? { expiresAt } : {}),
    };
}
