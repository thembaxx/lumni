export interface WebhookEndpoint {
  id: string;
  url: string;
  description?: string;
  events: string[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WebhookDelivery {
  id?: number;
  endpointId: string;
  event: string;
  payload: string;
  status: "success" | "failed" | "retrying";
  statusCode?: number;
  attempts: number;
  nextRetryAt?: number;
  createdAt: number;
  completedAt?: number;
}
