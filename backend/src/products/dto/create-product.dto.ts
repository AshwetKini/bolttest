export class CreateProductDto {
  readonly name: string;
  readonly description?: string;
  readonly price: number;
  readonly category?: string;
  readonly inStock?: boolean;
}
