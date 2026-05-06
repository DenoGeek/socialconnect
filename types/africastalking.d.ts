// Africa's Talking Node SDK has no official @types package. Minimal shape to
// satisfy our SMS sender; expand if other modules (Voice, Airtime) come into use.

declare module "africastalking" {
  interface SmsService {
    send(opts: {
      to: string[];
      message: string;
      from?: string;
    }): Promise<unknown>;
  }
  interface AfricasTalkingClient {
    SMS: SmsService;
  }
  function AfricasTalking(opts: {
    apiKey: string;
    username: string;
  }): AfricasTalkingClient;
  export default AfricasTalking;
}
