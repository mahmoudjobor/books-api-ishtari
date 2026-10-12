import { Controller, Get, Param, Query } from '@nestjs/common';
import { Book, BookPage } from './book.interface';
import { BooksService } from './books.service';
import { BookIdParamDto } from './dto/book-id-param.dto';
import { ListBooksQueryDto } from './dto/list-books-query.dto';

@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  @Get()
  list(@Query() query: ListBooksQueryDto): Promise<BookPage> {
    return this.books.list(query);
  }

  @Get(':id')
  getOne(@Param() params: BookIdParamDto): Promise<Book> {
    return this.books.getById(params.id);
  }
}
