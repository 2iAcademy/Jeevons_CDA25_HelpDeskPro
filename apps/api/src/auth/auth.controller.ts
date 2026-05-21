import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';

type LoginUser = { id: string; email: string; role: string; name: string };
type LoginRequest = ExpressRequest & { user: LoginUser };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(AuthGuard('local'))
  login(@Request() req: LoginRequest) {
    return this.authService.login(req.user);
  }
}
