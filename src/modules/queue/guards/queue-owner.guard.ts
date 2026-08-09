import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { QueueService } from '../queue.service';
import * as crypto from 'crypto';

@Injectable()
export class QueueOwnerGuard implements CanActivate {
  constructor(private queueService: QueueService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    let sessionId = request.query.sessionId || request.body.sessionId;
    
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      // append it to query so controller can easily read it if needed
      request.query.sessionId = sessionId;
    }

    const queue = await this.queueService.getQueue(user._id.toString(), sessionId);
    if (queue && queue.userId.toString() !== user._id.toString()) {
      throw new ForbiddenException('You do not own this queue');
    }
    
    // attach sessionId to the request for the controller
    request.sessionId = sessionId;
    return true;
  }
}
