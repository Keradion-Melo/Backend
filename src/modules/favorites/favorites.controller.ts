import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  addFavorite(@Request() req, @Body() addFavoriteDto: AddFavoriteDto) {
    return this.favoritesService.addFavorite(req.user._id.toString(), addFavoriteDto);
  }

  @Delete(':trackId')
  removeFavorite(
    @Request() req,
    @Param('trackId') trackId: string,
    @Query('service') service: string,
  ) {
    if (!service || !['jamendo', 'youtube'].includes(service)) {
      throw new BadRequestException(
        'Valid service query parameter is required (jamendo or youtube)',
      );
    }
    return this.favoritesService.removeFavorite(req.user._id.toString(), trackId, service);
  }

  @Get()
  findAll(@Request() req) {
    return this.favoritesService.findAll(req.user._id.toString());
  }
}
