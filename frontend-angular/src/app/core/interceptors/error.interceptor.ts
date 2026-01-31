import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError, timer } from 'rxjs';
import { catchError, retryWhen, take, mergeMap } from 'rxjs/operators';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    retryWhen(errors =>
      errors.pipe(
        mergeMap((error, index) => {
          if (index >= 3 || !isRetryable(error)) {
            return throwError(() => error);
          }
          
          const delayMs = Math.pow(2, index) * 1000;
          console.warn(`[RETRY] Tentativa ${index + 1}/3 em ${delayMs}ms`, error.message);
          return timer(delayMs);
        }),
        take(3)
      )
    ),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.error('[401] Não autorizado - redirecionando para login');
        router.navigate(['/login']);
      } else if (error.status === 403) {
        console.error('[403] Acesso negado');
      } else if (error.status >= 500) {
        console.error('[5xx] Erro no servidor:', error.message);
      } else if (error.status === 0) {
        console.error('[CONEXÃO] Falha de conexão');
      }

      return throwError(() => error);
    })
  );
};

function isRetryable(error: HttpErrorResponse): boolean {
  return error.status === 0 || error.status === 408 || error.status >= 500;
}
