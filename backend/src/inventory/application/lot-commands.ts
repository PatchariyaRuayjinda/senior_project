import type { LotFields } from '../domain/lot-rules';

export type LotInput = LotFields;
export interface LotUpdate extends LotInput {
    revision: number;
}
