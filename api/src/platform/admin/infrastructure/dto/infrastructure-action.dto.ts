import { IsIn, IsOptional, IsString } from 'class-validator';

export const INFRASTRUCTURE_ACTIONS = [
  'RELOAD_PM2',
  'RESTART_PM2',
  'FLUSH_PM2_LOGS',
  'RELOAD_NGINX',
  'RESTART_NGINX',
  'TEST_DATABASE_CONNECTION',
  'TRIGGER_DATABASE_BACKUP',
  'SEND_TEST_EMAIL',
  'PURGE_CLOUDFLARE_CACHE',
  'REBOOT_SERVER',
] as const;

export type InfrastructureActionType = (typeof INFRASTRUCTURE_ACTIONS)[number];

export class InfrastructureActionDto {
  @IsIn(INFRASTRUCTURE_ACTIONS, {
    message: `action must be one of: ${INFRASTRUCTURE_ACTIONS.join(', ')}`,
  })
  action!: InfrastructureActionType;

  @IsOptional()
  @IsString()
  target?: string;

  @IsOptional()
  @IsString()
  payload?: string;

  @IsOptional()
  @IsString()
  confirmationToken?: string;
}
