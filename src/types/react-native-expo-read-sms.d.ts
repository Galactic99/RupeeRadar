declare module '@maniac-tech/react-native-expo-read-sms' {
  export interface SMSPermissions {
    hasReadSmsPermission: boolean;
    hasReceiveSmsPermission: boolean;
  }
  
  export interface SMSMessage {
    messageBody: string;
    originatingAddress: string;
    timestamp?: number;
  }
  
  /**
   * Checks if the app has SMS permissions
   * @returns Promise that resolves to an object with permission status or false
   */
  export function checkIfHasSMSPermission(): Promise<SMSPermissions | false>;
  
  /**
   * Requests SMS read and receive permissions
   * @returns Promise that resolves to a boolean indicating if permissions were granted
   */
  export function requestReadSMSPermission(): Promise<boolean>;
  
  /**
   * Starts listening for SMS messages
   * @param onSMSReceived Callback function that is called when an SMS is received
   * @param onFailure Callback function that is called when there is an error
   * @returns Unsubscribe function that stops listening for SMS messages
   */
  export function startReadSMS(
    onSMSReceived: (sms: SMSMessage) => void,
    onFailure: (error: unknown) => void
  ): () => void;
} 