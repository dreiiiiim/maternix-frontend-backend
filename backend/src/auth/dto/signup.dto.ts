import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum SignupRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
}

export class SignupDto {
  @IsString()
  fullName!: string

  @IsEmail()
  email!: string

  @IsString()
  @MinLength(8)
  password!: string

  @IsEnum(SignupRole)
  role!: SignupRole

  @IsOptional()
  @IsString()
  studentNo?: string

  @IsOptional()
  @IsString()
  section?: string

  @IsOptional()
  @IsString()
  employeeId?: string

  @IsOptional()
  @IsString()
  department?: string
}
