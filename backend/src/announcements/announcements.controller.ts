import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Get('mine')
  getMyAnnouncements(@Headers('authorization') auth?: string) {
    const token = auth?.replace('Bearer ', '') ?? '';
    return this.service.getMyAnnouncements(token);
  }

  @Post()
  createAnnouncement(
    @Body()
    body: {
      title?: string;
      content?: string;
      category?: string;
    },
    @Headers('authorization') auth?: string
  ) {
    if (!body.title?.trim() || !body.content?.trim()) {
      throw new BadRequestException('title and content are required');
    }

    const token = auth?.replace('Bearer ', '') ?? '';
    return this.service.createAnnouncement(
      {
        title: body.title,
        content: body.content,
        category: body.category,
      },
      token
    );
  }

  @Delete(':id')
  deleteAnnouncement(
    @Param('id') id: string,
    @Headers('authorization') auth?: string
  ) {
    const token = auth?.replace('Bearer ', '') ?? '';
    return this.service.deleteAnnouncement(id, token);
  }

  @Patch(':id')
  updateAnnouncement(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      content?: string;
      category?: string;
    },
    @Headers('authorization') auth?: string
  ) {
    if (!body.title?.trim() || !body.content?.trim()) {
      throw new BadRequestException('title and content are required');
    }

    const token = auth?.replace('Bearer ', '') ?? '';
    return this.service.updateAnnouncement(
      id,
      {
        title: body.title,
        content: body.content,
        category: body.category,
      },
      token
    );
  }

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
