import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError, timer } from 'rxjs';
import { catchError, retryWhen, mergeMap, tap } from 'rxjs/operators';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    retryWhen(errors =>
      errors.pipe(
        mergeMap((error, retryCount) => {
          // Don't retry if max retries reached or error is not retryable
          if (retryCount >= MAX_RETRIES || !isRetryable(error)) {
            return throwError(() => error);
          }
          
          // Exponential backoff: 1s, 2s, 4s
          const delayMs = INITIAL_DELAY_MS * Math.pow(2, retryCount);
          console.warn(`[HTTP RETRY] Attempt ${retryCount + 1}/${MAX_RETRIES} in ${delayMs}ms - ${error.message}`);
          
          return timer(delayMs);
        })
      )
    ),
    catchError((error: HttpErrorResponse) => {
      // Handle specific error codes
      if (error.status === 401) {
        console.error('[401 Unauthorized] Redirecting to login');
        router.navigate(['/login']);
      } else if (error.status === 403) {
        console.error('[403 Forbidden] Access denied');
      } else if (error.status === 409) {
        console.error('[409 Conflict] Concurrent modification detected');
      } else if (error.status >= 500) {
        console.error('[5xx Server Error]', error.message);
      } else if (error.status === 0) {
        console.error('[Network Error] Connection failed');
      }

      return throwError(() => error);
    })
  );
};

/**
 * Determines if an HTTP error should be retried with exponential backoff
 * @param error HTTP error response
 * @returns true if error is retryable (network issues, timeouts, server errors)
 */
function isRetryable(error: HttpErrorResponse): boolean {
  // Retry on:
  // - Network failures (status 0)
  // - Timeouts (408)
  // - Server errors (5xx)
  // - Rate limiting (429)
  return error.status === 0 || 
         error.status === 408 || 
         error.status === 429 ||
         (error.status >= 500 && error.status < 600);
}
