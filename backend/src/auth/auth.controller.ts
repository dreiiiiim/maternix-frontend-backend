import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { ApproveDto } from './dto/approve.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto)
  }

  @Post('approve')
  approve(@Body() dto: ApproveDto, @Headers('authorization') auth?: string) {
    const token = auth?.replace('Bearer ', '') ?? ''
    return this.authService.approveUser(dto, token)
  }
}
