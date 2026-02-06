import type { FinishReason } from 'ai';

export const CONTINUE_RESPONSE_PROMPT =
  'Continue from exactly where you stopped. Do not repeat any previous text.';

interface ContinuationHintParams {
  finishReason?: FinishReason;
  isAbort: boolean;
  isDisconnect: boolean;
  isError: boolean;
}

export const getContinuationHint = ({
  finishReason,
  isAbort,
  isDisconnect,
  isError,
}: ContinuationHintParams): string | null => {
  if (isAbort) {
    return null;
  }

  if (finishReason === 'length') {
    return 'Response was cut before completion. Tap Continue to finish it.';
  }

  if (isDisconnect || isError || finishReason === 'error') {
    return 'Connection was interrupted. Tap Continue to resume the answer.';
  }

  return null;
};
