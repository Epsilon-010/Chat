export interface MessageChat {
  sender_id: number;       // 1 = tú, 0 = otro
  sender_name?: string;    // quién lo envió
  content: string;
  create_at: string;
}
