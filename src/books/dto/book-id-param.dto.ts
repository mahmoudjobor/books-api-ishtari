import { IsInt, Max, Min } from 'class-validator';
import { ToInt } from '../../common/decorators/to-int.decorator';

export class BookIdParamDto {
  @ToInt()
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  id!: number;
}
