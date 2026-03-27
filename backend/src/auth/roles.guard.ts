import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

// 1. Definimos qué esperamos que tenga el Request
interface RequestWithUser {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // 2. Usamos un Genérico <RequestWithUser> al obtener el request.
    // Esto elimina el error de "Unsafe assignment"
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // 3. Ahora request.user ya no es 'any', tiene el tipo que definimos arriba
    const user = request.user;

    if (user && user.role === 'ADMIN') {
      return true;
    }

    throw new ForbiddenException(
      'No tienes permisos de Administrador para ver esto',
    );
  }
}
