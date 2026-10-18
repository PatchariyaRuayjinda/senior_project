import { ApplicationError } from '../../shared/domain/errors';
import { requiredText } from './text';

export interface ProductFields {
    sku: string;
    name: string;
    unit: string;
    maxQuantityPerPallet: number;
    tracksExpiry: boolean;
    pickingMinimum: number;
    pickingTarget: number;
}
export function productFields(input: ProductFields): ProductFields {
    if (input.pickingTarget < input.pickingMinimum) {
        throw new ApplicationError(
            'validation',
            'INVALID_PICKING_TARGET',
            'Picking target must be at least the minimum.',
        );
    }
    return {
        sku: requiredText(input.sku, 'SKU').toUpperCase(),
        name: requiredText(input.name, 'Name'),
        unit: requiredText(input.unit, 'Unit'),
        maxQuantityPerPallet: input.maxQuantityPerPallet,
        tracksExpiry: input.tracksExpiry,
        pickingMinimum: input.pickingMinimum,
        pickingTarget: input.pickingTarget,
    };
}
