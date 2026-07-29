import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class BodyLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP-Body');

  use(req: Request, res: Response, next: NextFunction) {
    if (process.env.NODE_ENV !== 'production') {
      if (req.body && Object.keys(req.body).length > 0) {
        this.logger.debug(`[Request] ${req.method} ${req.originalUrl} - Body: ${JSON.stringify(req.body)}`);
      } else {
        this.logger.debug(`[Request] ${req.method} ${req.originalUrl} - No Body`);
      }
      
      const oldSend = res.send;
      res.send = (data) => {
        let parsedData = data;
        try {
          if (typeof data === 'string') {
            parsedData = JSON.parse(data);
          }
        } catch (e) {}
        
        this.logger.debug(`[Response] ${req.method} ${req.originalUrl} - Body: ${JSON.stringify(parsedData)}`);
        return oldSend.call(res, data);
      };
    }
    next();
  }
}
