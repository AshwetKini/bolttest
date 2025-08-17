export class CreateCustomerDto {
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly address?: string;
  readonly isActive?: boolean;
}
