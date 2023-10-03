// jsdocs

/** Represents a task to be executed in a worker thread.
 * @typedef {Object} WorkerTask
 * @property {Function} fn - The function to be executed in the worker thread.
 * @property {any} [data] - Additional data needed for the task.
 */

/** Represents a worker object containing the worker instance and its identifier.
 * @typedef {Object} WorkerObject
 * @property {Worker|boolean} worker - The worker instance.
 * @property {string} [id] - The unique identifier of the worker.
 * @property {*} [error] - The unique identifier of the worker.
 */

/** Represents a task that is waiting for a worker thread to complete its execution.
* @typedef {Object} WaitingTask
* @property {Function} resolve - The function to resolve the waiting task's promise.
*/

/**
* A promise that resolves when the worker thread completes its execution.
* @type {Promise<void>}
*/