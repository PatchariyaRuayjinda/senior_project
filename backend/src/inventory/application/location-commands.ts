import type { LocationFields } from '../domain/location-rules';

export type LocationInput = LocationFields;
export interface LocationUpdate extends LocationInput {
    revision: number;
    active: boolean;
    inboundBlocked: boolean;
    outboundBlocked: boolean;
    reason?: string;
    labelConfirmed?: boolean;
}
