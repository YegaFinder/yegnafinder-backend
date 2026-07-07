import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './services/auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

/** Wrap any payload in the standard { success, data, message } envelope. */
function ok<T>(data: T, message?: string) {
  return { success: true, data, message };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /* ------------------------------------------------------------------ */
  /*  Registration                                                        */
  /* ------------------------------------------------------------------ */

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered — OTP sent to email.' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() registerDto: RegisterDto) {
    await this.authService.register(registerDto);
    return ok(null, 'Registration successful. Please check your email for the OTP.');
  }

  /* ------------------------------------------------------------------ */
  /*  Login                                                               */
  /* ------------------------------------------------------------------ */

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Email not verified' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress;
    // user-agent can be string | string[] — normalise to a single string
    const deviceInfo = String(req.headers['user-agent'] ?? '');
    const result = await this.authService.login(loginDto, deviceInfo, ipAddress);
    return ok(result, 'Login successful');
  }

  /* ------------------------------------------------------------------ */
  /*  Token refresh                                                       */
  /* ------------------------------------------------------------------ */

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate a refresh token — issues a fresh access + refresh pair' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() body: RefreshTokenDto, @Req() req: Request) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress;
    const deviceInfo = String(req.headers['user-agent'] ?? '');
    const result = await this.authService.refresh(body.refreshToken, deviceInfo, ipAddress);
    return ok(result, 'Token refreshed');
  }

  /* ------------------------------------------------------------------ */
  /*  Current user                                                        */
  /* ------------------------------------------------------------------ */

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: User) {
    const profile = await this.authService.getMe(user.id);
    return ok(profile);
  }

  /* ------------------------------------------------------------------ */
  /*  Google Social Login                                                 */
  /* ------------------------------------------------------------------ */

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in / sign up with a Google idToken' })
  @ApiResponse({ status: 200, description: 'Google login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid Google token' })
  async googleLogin(@Body() body: GoogleLoginDto, @Req() req: Request) {
    const ipAddress = req.ip ?? req.socket?.remoteAddress;
    const deviceInfo = String(req.headers['user-agent'] ?? '');
    const result = await this.authService.googleLogin(body.idToken, deviceInfo, ipAddress);
    return ok(result, 'Google login successful');
  }

  /* ------------------------------------------------------------------ */
  /*  Logout (single device)                                              */
  /* ------------------------------------------------------------------ */

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout — revoke the presented refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Body() body: RefreshTokenDto) {
    await this.authService.logout(body.refreshToken);
    return ok(null, 'Logged out successfully');
  }

  /* ------------------------------------------------------------------ */
  /*  Logout all devices                                                  */
  /* ------------------------------------------------------------------ */

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices — revoke every active session' })
  @ApiResponse({ status: 200, description: 'Logged out from all devices' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logoutAll(@CurrentUser() user: User) {
    await this.authService.logoutAll(user.id);
    return ok(null, 'Logged out from all devices');
  }

  /* ------------------------------------------------------------------ */
  /*  Email verification                                                  */
  /* ------------------------------------------------------------------ */

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP' })
  @ApiResponse({ status: 200, description: 'Email successfully verified' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    await this.authService.verifyOtp(verifyOtpDto);
    return ok(null, 'Email successfully verified.');
  }

  /* ------------------------------------------------------------------ */
  /*  Resend verification OTP                                             */
  /* ------------------------------------------------------------------ */

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification OTP' })
  @ApiResponse({ status: 200, description: 'OTP sent to email.' })
  @ApiResponse({ status: 403, description: 'Email is already verified' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resendVerification(@Body() requestDto: RequestPasswordResetDto) {
    await this.authService.resendVerificationOtp(requestDto.email);
    return ok(null, 'Verification code resent successfully.');
  }

  /* ------------------------------------------------------------------ */
  /*  Forgot password (alias: /auth/forgot-password)                     */
  /* ------------------------------------------------------------------ */

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP (forgot-password)' })
  @ApiResponse({ status: 200, description: 'If the email exists, an OTP has been sent.' })
  async forgotPassword(@Body() requestDto: RequestPasswordResetDto) {
    await this.authService.requestPasswordReset(requestDto);
    return ok(
      { message: 'If the email is registered, a password reset OTP has been sent.' },
      'Request processed',
    );
  }

  /**
   * Legacy alias kept for backward compatibility.
   * @deprecated Use POST /auth/forgot-password instead.
   */
  @Public()
  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP (legacy alias)' })
  @ApiResponse({ status: 200, description: 'If the email exists, an OTP has been sent.' })
  async requestPasswordReset(@Body() requestDto: RequestPasswordResetDto) {
    await this.authService.requestPasswordReset(requestDto);
    return ok(
      { message: 'If the email is registered, a password reset OTP has been sent.' },
      'Request processed',
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Reset password                                                      */
  /* ------------------------------------------------------------------ */

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with OTP' })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  @ApiResponse({ status: 400, description: 'Invalid OTP or password criteria not met' })
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetDto);
    return ok(null, 'Password has been successfully reset.');
  }
}
