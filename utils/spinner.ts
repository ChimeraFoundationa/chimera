import ora, { Ora } from 'ora';

export const withSpinner = async <T>(
  text: string,
  task: () => Promise<T>
): Promise<T> => {
  const spinner: Ora = ora({
    text: text,
    spinner: 'dots12', // Gaya spinner yang lebih menarik
    color: 'cyan'
  }).start();
  
  try {
    const result = await task();
    // PERBAIKAN: Lewatkan pesan sebagai string, bukan object
    spinner.succeed('✨ ' + text.replace('...', ' complete!'));
    return result;
  } catch (error) {
    // PERBAIKAN: Lewatkan pesan sebagai string, bukan object
    spinner.fail('❌ ' + text.replace('...', ' failed!'));
    throw error;
  }
};
