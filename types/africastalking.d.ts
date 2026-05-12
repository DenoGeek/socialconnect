declare module "africastalking" {
  interface SmsResult {
    SMSMessageData?: {
      Recipients?: Array<{
        statusCode: number;
        number: string;
        cost: string;
        status: string;
        messageId: string;
      }>;
    };
  }
  interface SmsService {
    send(opts: {
      to: string | string[];
      message: string;
      from?: string;
    }): Promise<SmsResult>;
  }
  interface AfricasTalkingClient {
    SMS: SmsService;
  }
  interface AfricasTalkingFactory {
    (opts: { apiKey: string; username: string }): AfricasTalkingClient;
  }
  const AfricasTalking: AfricasTalkingFactory;
  export default AfricasTalking;
}
