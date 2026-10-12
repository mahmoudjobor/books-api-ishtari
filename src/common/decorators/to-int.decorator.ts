import { Transform } from 'class-transformer';

// "5" -> 5, but "abc", "5.5", "1e2", "" stay as they are and fail @IsInt()
export const ToInt = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && /^-?\d+$/.test(value) ? Number(value) : value,
  );
