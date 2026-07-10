export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export interface PushDeliveryResult {
  sent: number;
  total: number;
}
