import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ToInt } from '../../common/decorators/to-int.decorator';

export class ListBooksQueryDto {
  @ToInt()
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  page: number = 1;

  @ToInt()
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 5;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(200)
  search?: string;
}
