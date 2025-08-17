import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Response,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Get sales report' })
  @ApiResponse({ status: 200, description: 'Sales report retrieved successfully' })
  async getSalesReport(@Request() req, @Query() query) {
    return this.reportsService.getSalesReport(req.user, query);
  }

  @Get('sales/csv')
  @ApiOperation({ summary: 'Download sales report as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file downloaded' })
  async downloadSalesReportCsv(@Request() req, @Query() query, @Response() res) {
    const reportData = await this.reportsService.getSalesReport(req.user, query);
    const csv = this.reportsService.generateCsvReport(reportData.dailyData, 'sales');

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=sales-report.csv',
    });

    res.send(csv);
  }

  @Get('store-performance')
  @ApiOperation({ summary: 'Get store performance report' })
  @ApiResponse({ status: 200, description: 'Store performance report retrieved successfully' })
  async getStorePerformanceReport(@Request() req, @Query() query) {
    return this.reportsService.getStorePerformanceReport(req.user, query);
  }

  @Get('store-performance/csv')
  @ApiOperation({ summary: 'Download store performance report as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file downloaded' })
  async downloadStorePerformanceReportCsv(@Request() req, @Query() query, @Response() res) {
    const reportData = await this.reportsService.getStorePerformanceReport(req.user, query);
    const csv = this.reportsService.generateCsvReport(reportData, 'store-performance');

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=store-performance-report.csv',
    });

    res.send(csv);
  }
}