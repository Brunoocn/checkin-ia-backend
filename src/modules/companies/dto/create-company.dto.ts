import { IsOptional, IsString, Matches } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{14}$/, {
    message: 'CNPJ deve conter exatamente 14 dígitos numéricos, sem máscara.',
  })
  cnpj?: string;
}
