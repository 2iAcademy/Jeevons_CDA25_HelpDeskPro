import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Priority, Category } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  client!: string;

  @IsEnum(Priority)
  priority!: Priority;

  @IsEnum(Category)
  category!: Category;
}
