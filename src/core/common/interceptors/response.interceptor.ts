import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Readable } from 'node:stream';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../responses/api.response';
import { PaginatedResponse } from '../responses/paginated-api.response';

// A handler that returned a PaginatedResponse ({ data, meta }) would otherwise get double-nested
// under the envelope's `data`. Detect it and hoist `meta` up to the top level.
const isPaginated = (value: unknown): value is PaginatedResponse<unknown> =>
  typeof value === 'object' && value !== null && 'data' in value && 'meta' in value;

// Binary payloads must reach the client as raw bytes. Wrapping a StreamableFile in the JSON
// envelope serialises the stream *object*, so a PDF arrives as
// { data: { stream: { _readableState: { buffer: [37, 80, 68, 70, ...] } } } } — a JSON
// description of a stream rather than a file the browser can render. Pass these through
// untouched so Nest writes the bytes and the handler's own Content-Type/Disposition.
const isBinary = (value: unknown): boolean =>
  value instanceof StreamableFile || Buffer.isBuffer(value) || value instanceof Readable;

type Envelope<T> = ApiResponse<T> | StreamableFile | Buffer | Readable;

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Envelope<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Envelope<T>> {
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data): Envelope<T> => {
        if (isBinary(data)) {
          return data as StreamableFile | Buffer | Readable;
        }

        if (isPaginated(data)) {
          return { 
            statusCode, 
            message: 'Success', 
            data: data.data as T, 
            meta: data.meta 
          };
        }

        return { 
          statusCode, 
          message: 'Success', 
          data 
        };
      }),
    );
  }
}
