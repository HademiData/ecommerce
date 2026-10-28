var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, ServiceUnavailableException, UnauthorizedException, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
let InternalServiceGuard = class InternalServiceGuard {
    config;
    constructor(config) {
        this.config = config;
    }
    canActivate(context) {
        const expected = this.config.get('INTERNAL_SERVICE_SECRET');
        if (!expected) {
            throw new ServiceUnavailableException('Internal service authentication is not configured');
        }
        const request = context.switchToHttp().getRequest();
        const supplied = request.headers['x-internal-service-secret'];
        if (typeof supplied !== 'string' ||
            supplied.length !== expected.length ||
            !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
            throw new UnauthorizedException('Invalid internal service credentials');
        }
        return true;
    }
};
InternalServiceGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], InternalServiceGuard);
export { InternalServiceGuard };
//# sourceMappingURL=internal-service.guard.js.map