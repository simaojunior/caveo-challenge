import { User, type UserRole, type UserProps } from '../entities/user';

export class UserUpdateBuilder {
  private updateData: Partial<UserProps> = {};
  private shouldMarkOnboarded = false;

  constructor(private baseUser: UserProps) {}

  withName(name?: string): this {
    if (name) {
      this.updateData.name = name;
      this.shouldMarkOnboarded = true;
    }

    return this;
  }

  withRole(role?: UserRole, canEditRole = false): this {
    if (role && canEditRole) {
      this.updateData.role = role;
    }

    return this;
  }

  build(): { user: User; shouldMarkOnboarded: boolean } {
    const user = User.create({
      ...this.baseUser,
      ...this.updateData,
    });

    return {
      user,
      shouldMarkOnboarded: this.shouldMarkOnboarded,
    };
  }
}
