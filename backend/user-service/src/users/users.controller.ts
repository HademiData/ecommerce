import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { UsersService } from './users.service.js';


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  
    @Get('me')
    @UseGuards(JwtAuthGuard)
    getMe(@CurrentUser() user: Express.User) {
        return user;
    }
    @Get('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    getAdmin() {
    return {
        message: 'Welcome admin',
    };
    }
  @Get('admin/customers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAllCustomers() {
    return this.usersService.findAllCustomers();
  }
}

