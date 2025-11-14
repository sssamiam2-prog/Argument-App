
export enum ToneMode {
  Professional = 'professional',
  InYourFace = 'in_your_face',
  MarriagePartner = 'marriage_or_partner',
}

export interface FormState {
  conversationText: string;
  userSide?: string;
  toneMode: ToneMode;
  goal?: string;
  deviceId?: string;
}

export interface GeminiResponse {
  shortResponse: string;
  coachingNotes: string;
}
