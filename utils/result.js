// Result Pattern utility for consistent API responses
// Provides a standardized way to handle success and error results in backend services.
// Usage Example:
//   const Result = require('./result');
//   return Result.success(data);
//   return Result.error('Error message', errorCode);

class Result {
  /**
   * Returns a success result object.
   * @param {any} data - The data to return.
   * @param {string} [message] - Optional success message.
   * @returns {{ success: true, data: any, message: string }}
   */
  static success(data, message = 'Success') {
    return {
      success: true,
      data,
      message
    };
  }

  /**
   * Returns an error result object.
   * @param {string} message - Error message.
   * @param {number} [code] - Optional error code.
   * @param {any} [details] - Optional error details.
   * @returns {{ success: false, message: string, code?: number, details?: any }}
   */
  static error(message, code = 500, details = null) {
    const result = {
      success: false,
      message,
      code
    };
    if (details) {
      result.details = details;
    }
    return result;
  }
}

module.exports = Result;