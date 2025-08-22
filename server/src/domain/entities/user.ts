/**
 * Make some property optional on type
 *
 * @example
 * ```typescript
 * type Post {
 *  id: string;
 *  name: string;
 *  email: string;
 * }
 *
 * Optional<Post, 'id' | 'email'>
 * ```
 **/

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>
export const UserRole = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export type UserProps = {
  id: string
  name?: string
  email: string
  role: UserRole
  isOnboarded: boolean
  externalId?: string
  createdAt: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export class User {
  constructor(private props: UserProps) {
    this.props = props;
  }

  static create(props: Optional<UserProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'isOnboarded' | 'role'>) {
    return new User(
      {
        ...props,
        id: props.id ?? crypto.randomUUID(),
        role: props.role ?? UserRole.USER,
        isOnboarded: props.isOnboarded ?? false,
        createdAt: props.createdAt ?? new Date(),
      },
    );
  }

  get id() {
    return this.props.id;
  }

  get name() {
    return this.props.name;
  }

  get email() {
    return this.props.email;
  }

  get role() {
    return this.props.role;
  }

  get isOnboarded() {
    return this.props.isOnboarded;
  }

  get externalId() {
    return this.props.externalId;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get deletedAt() {
    return this.props.deletedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  markAsOnboarded() {
    this.props.isOnboarded = true;
    this.touch();
  }

  setExternalId(externalId: string) {
    this.props.externalId = externalId;
    this.touch();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      isOnboarded: this.isOnboarded,
      externalId: this.externalId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
