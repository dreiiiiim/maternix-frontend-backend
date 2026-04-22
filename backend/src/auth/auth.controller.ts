import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { ApproveDto } from './dto/approve.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Public — no auth required. Used by signup page to populate section dropdown. */
  @Get('sections')
  getSections() {
    return this.authService.getSections()
  }

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto)
  }

  @Post('approve')
  approve(@Body() dto: ApproveDto, @Headers('authorization') auth?: string) {
    const token = auth?.replace('Bearer ', '') ?? ''
    return this.authService.approveUser(dto, token)
  }

  @Post('remove')
  remove(@Body('userId') userId: string, @Headers('authorization') auth?: string) {
    const token = auth?.replace('Bearer ', '') ?? ''
    return this.authService.removeUser(userId, token)
  }
}
