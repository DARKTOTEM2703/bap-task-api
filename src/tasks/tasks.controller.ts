import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @Body() createTaskDto: CreateTaskDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.tasksService.create(createTaskDto, userId ?? 'system');
  }

  @Get()
  findAll(
    @Headers('x-user-id') userId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.tasksService.findAll(userId ?? 'system', +page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.tasksService.update(+id, updateTaskDto, userId ?? 'system');
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-user-id') userId?: string) {
    return this.tasksService.remove(+id, userId ?? 'system');
  }
}
