import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum SignupRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
}

export class SignupDto {
  @IsString()
  firstName!: string

  @IsString()
  lastName!: string

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

  // Accept section by ID (preferred) or by name (legacy)
  @IsOptional()
  @IsString()
  sectionId?: string

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
