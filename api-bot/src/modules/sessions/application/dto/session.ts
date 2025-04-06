export class SessionDto {
  id: string;
  preferredLanguage: string;
  preferredCurrency: string;
}

export class CreateSessionResultDto {
  id: string;
}

export class CreateSessionDto extends SessionDto {
  preferredLanguage: string;
  preferredCurrency: string;
}
