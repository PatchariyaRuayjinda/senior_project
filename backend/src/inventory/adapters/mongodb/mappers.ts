/** MongoDB identity is translated here; application models never expose _id. */
export type MongoRecord<T extends { id: string }> = Omit<T, 'id'> & { _id: string };

export function fromDocument<T extends { _id: string }>({ _id, ...fields }: T) {
    return { id: _id, ...fields };
}

export function toDocument<T extends { id: string }>({ id, ...fields }: T): MongoRecord<T> {
    return { _id: id, ...fields };
}
