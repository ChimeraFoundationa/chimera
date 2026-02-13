import ora, { Ora } from 'ora';

export const withSpinner = async <T>(
  text: string,
  task: () => Promise<T>
): Promise<T> => {
  const spinner: Ora = ora({
    text: text,
    spinner: 'clock', // Clean spinner style
    color: 'blue'
  }).start();

  try {
    const result = await task();
    // FIX: Pass message as string, not object
    spinner.succeed(text.replace('...', ': done'));
    return result;
  } catch (error) {
    // FIX: Pass message as string, not object
    spinner.fail(text.replace('...', ': failed'));
    throw error;
  }
};
