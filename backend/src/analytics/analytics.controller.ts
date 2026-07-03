import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  getSummary() {
    return this.analyticsService.getSummary();
  }

  @Get('top-products')
  getTopProducts(@Query('limit') limit?: string) {
    return this.analyticsService.getTopProducts(
      limit ? parseInt(limit, 10) : 5,
    );
  }

  @Get('sales-chart')
  getSalesChart(@Query('days') days?: string) {
    return this.analyticsService.getSalesChart(
      days ? parseInt(days, 10) : 7,
    );
  }

  @Get('heatmap')
  getHeatmap() {
    return this.analyticsService.getHourlyHeatmap();
  }
}
