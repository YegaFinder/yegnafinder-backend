import { IsNotEmpty, IsUUID, Length } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  businessId: string;

  @IsNotEmpty()
  @Length(1, 2000)
  text: string;

  conversationId?: string;
}
