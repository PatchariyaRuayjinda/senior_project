import { ApplicationError } from '../../shared/domain/errors';

export function requiredText(value: string, field: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
        throw new ApplicationError('validation', 'INVALID_REQUEST', `${field} must not be blank.`);
    }
    return trimmed;
}
