declare module 'react-native-get-sms-android' {
  /**
   * Filter options for fetching SMS messages
   */
  interface SmsFilter {
    box?: 'inbox' | 'sent' | 'draft' | 'outbox' | 'failed' | 'queued';
    maxCount?: number;
    indexFrom?: number;
    address?: string;
    body?: string;
    read?: 0 | 1;
    _id?: string;
    thread_id?: string;
  }

  interface SmsAndroidStatic {
    /**
     * List SMS messages based on filter
     * @param filter JSON string with filter parameters
     * @param fail Callback function when operation fails
     * @param success Callback function when operation succeeds with count and list of messages
     */
    list(
      filter: string,
      fail: (error: string) => void,
      success: (count: number, smsList: string) => void
    ): void;

    /**
     * Delete SMS messages by ID
     * @param messageId ID of the message to delete
     * @param fail Callback function when operation fails
     * @param success Callback function when operation succeeds
     */
    delete(
      messageId: string | number,
      fail: (error: string) => void,
      success: (success: boolean) => void
    ): void;
  }

  const SmsAndroid: SmsAndroidStatic;
  export default SmsAndroid;
} 