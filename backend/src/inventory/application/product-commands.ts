import type { ProductFields } from '../domain/product-rules';

export type ProductInput = ProductFields;
export interface ProductUpdate extends ProductInput {
    revision: number;
    active: boolean;
}
