import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum ApproveAction {
  APPROVE = 'approve',
  REJECT = 'reject',
}

export class ApproveDto {
  @IsUUID()
  userId!: string

  @IsEnum(ApproveAction)
  action!: ApproveAction

  @IsOptional()
  @IsString()
  reason?: string
}
