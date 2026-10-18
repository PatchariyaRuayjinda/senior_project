import { t } from 'elysia';

export const text = () => t.String({ minLength: 1, maxLength: 160 });
export const whole = (minimum = 0) => t.Integer({ minimum, maximum: Number.MAX_SAFE_INTEGER });
export const productFields = {
    sku: t.String({ minLength: 1, maxLength: 64 }),
    name: text(),
    unit: text(),
    maxQuantityPerPallet: whole(1),
    tracksExpiry: t.Boolean(),
    pickingMinimum: whole(),
    pickingTarget: whole(),
};
export const lotFields = {
    productId: text(),
    lotNumber: t.Optional(t.String({ maxLength: 160 })),
    manufacturedAt: t.Optional(t.String({ maxLength: 10 })),
    expiresAt: t.Optional(t.String({ maxLength: 10 })),
};
export const locationFields = {
    code: t.String({ minLength: 1, maxLength: 64 }),
    kind: t.Union([t.Literal('picking'), t.Literal('reserve'), t.Literal('temporary')]),
    zone: t.Union([
        t.Literal('A'),
        t.Literal('B'),
        t.Literal('C'),
        t.Literal('R'),
        t.Literal('TMP'),
    ]),
};
export const params = t.Object({ id: text() });
export const strict = { additionalProperties: false };
