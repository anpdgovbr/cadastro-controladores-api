import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { jwtConstants } from './constants';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  private readonly logger = new Logger("Guard");

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    } 
    
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
   
    if (!token) {
        this.logger.log("Token não encontrado");
        throw new UnauthorizedException();
    }
    try {
        this.logger.log("Verificando token");
        const payload = await this.jwtService.verifyAsync(token, {
            secret: jwtConstants.secret,
        });
        
        this.logger.log(payload);
        
        request['user'] = payload;
    } catch (error) {
        this.logger.log("Erro ao verificar token: " + error);
        throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}