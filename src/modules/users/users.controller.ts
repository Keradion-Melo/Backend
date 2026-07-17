import { Controller, Get, Patch, Body, UseGuards, Request, Param, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req) {
    const user = await this.usersService.findSafeById(String(req.user._id));
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Patch('me')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    const updatedUser = await this.usersService.updateProfile(String(req.user._id), updateProfileDto);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findSafeById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
