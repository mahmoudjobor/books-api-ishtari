import { NotFoundException } from '@nestjs/common';

export class BookNotFoundException extends NotFoundException {
  constructor(id: number) {
    super({ code: 'BOOK_NOT_FOUND', message: `Book ${id} not found` });
  }
}
