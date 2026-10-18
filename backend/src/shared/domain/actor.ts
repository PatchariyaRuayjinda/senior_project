export type Role = 'admin' | 'staff';

export interface Actor {
    id: string;
    username: string;
    role: Role;
}
