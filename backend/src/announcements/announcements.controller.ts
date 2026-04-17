import {
  Body,
  BadRequestException,
  Controller,
  Headers,
  Post,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Post('email')
  sendAnnouncementEmail(
    @Body() body: { announcementId?: string },
    @Headers('authorization') auth?: string
  ) {
    if (!body.announcementId) {
      throw new BadRequestException('announcementId is required')
    }

    const token = auth?.replace('Bearer ', '') ?? ''
    return this.service.sendAnnouncementEmail(body.announcementId, token)
  }
}
