// Retry Helper utility for retrying asynchronous operations with configurable attempts and delays
// Useful for handling transient failures (e.g., network requests, database operations)
// Usage Example:
//   const retry = require('./retryHelper');
//   await retry(async () => await fetchData(), { retries: 3, delay: 1000 });

/**
 * Retries an asynchronous function with configurable attempts and delay.
 * @param {Function} fn - The async function to retry.
 * @param {Object} options - Retry options.
 * @param {number} [options.retries=3] - Number of retry attempts.
 * @param {number} [options.delay=1000] - Delay between retries in ms.
 * @param {boolean} [options.exponential=false] - Use exponential backoff if true.
 * @returns {Promise<any>} - The result of the async function if successful.
 * @throws - The last error if all retries fail.
 */
async function retry(fn, options = {}) {
  const {
    retries = 3,
    delay = 1000,
    exponential = false
  } = options;
  let attempt = 0;
  let lastError;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      attempt++;
      if (attempt < retries) {
        const wait = exponential ? delay * Math.pow(2, attempt - 1) : delay;
        await new Promise(res => setTimeout(res, wait));
      }
    }
  }
  throw lastError;
}

module.exports = retry;