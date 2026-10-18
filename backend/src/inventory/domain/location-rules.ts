import { ApplicationError } from '../../shared/domain/errors';
import type { LocationKind, Zone } from './models';
import { requiredText } from './text';

export interface LocationFields {
    code: string;
    kind: LocationKind;
    zone: Zone;
}

export function locationFields(input: LocationFields, id?: string) {
    const code = requiredText(input.code, 'Location code').toUpperCase();
    const validZone =
        input.kind === 'picking'
            ? ['A', 'B', 'C'].includes(input.zone)
            : input.kind === 'reserve'
              ? input.zone === 'R'
              : input.zone === 'TMP';
    if (!validZone)
        throw new ApplicationError(
            'validation',
            'INVALID_LOCATION_ZONE',
            'The zone must match the location kind.',
        );
    if ((input.kind === 'temporary' || code === 'TMP01') && id !== 'TMP01') {
        throw new ApplicationError(
            'conflict',
            'TEMPORARY_LOCATION_FIXED',
            'TMP01 is the dedicated temporary slot.',
        );
    }
    return { code, kind: input.kind, zone: input.zone };
}
