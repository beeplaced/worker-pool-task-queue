const { Worker, workerData } = require('worker_threads');
const CustomError = require('./types/customError')

class WorkerPool {
/** Creates a new WorkerPool instance.
* @param {number} poolSize - The size of the worker pool.
* @param {string} workerFilePath - The file path of the worker script.
* @param {number} maxWorkers - The maximum number of workers allowed in the pool.
*/
    constructor(poolSize, workerFilePath, maxWorkers, returnWorker=false) {
        
        /** @type {boolean} */ this.returnWorker = returnWorker

        /** The pool of worker threads. 
         * @type {Array<WorkerObject>} */ this.pool = [];

        /** The file path of the worker script.
         * @type {string} */ this.workerFilePath = workerFilePath;

        /** The maximum number of workers allowed in the pool.
         * @type {number} */ this.maxWorkers = maxWorkers;

        for (let i = 0; i < poolSize; i++) {        // Initialize worker pool
            const worker = new Worker(workerFilePath, { workerData });
            const workerId = `Worker-${i + 1}`;

            /** Handles worker errors and logs them to the console.
             * @param {Error} error - The error object emitted by the worker.
             */ const handleError = (error) => {
                console.error(`Worker ${workerId} error:`, error);
            };

            worker.on('error', handleError);
            this.pool.push({ id: workerId, worker });
        }

        /** The queue of tasks awaiting execution.
         * @type {Array<WorkerTask>} */ this.taskQueue = [];
    }

    increaseWorkerPool = async () => {
            if (this.pool.length < this.maxWorkers) {
                try {
                const newWorker = new Worker(this.workerFilePath, { workerData });
                const workerId = `increased worker-${this.pool.length + 1}`;
                    newWorker.on('error', (/** @type {*} */ error) => {
                    throw new CustomError(error, 300)
                });
                this.pool.push({ id: workerId, worker: newWorker });
                return `Worker ${workerId} added successfully.`
                } catch (/** @type {*} */ err) {
                    throw new CustomError(err, 300)
                }
            } else {
                throw new CustomError('Maximum worker limit reached.', 300)
            }
    };

    executeWorkerTask = async (worker, requestInput) => {
        return new Promise((resolve) => { // Use once to handle the response from the worker
            worker.once('message', (data) => {
                resolve(data)
            })
            worker.postMessage(requestInput)
        })
    }

/** Gets an available worker from the worker pool.
* @async * @returns {Promise<WorkerObject>} - A promise representing the worker object or a flag indicating no available worker.
*/ getWorker = async () => {
        try {
            if (this.pool.length === 0) {
                await this.increaseWorkerPool();
            }
            const workerItem = this.pool.pop();
            if (!workerItem) {
                return { worker: false };
            }
            return workerItem;
        } catch (error) {
            return { worker: false, error };
        }
    };

    addTaskQueue = async (task) => {
        this.taskQueue.push(task)
        return await this.waitForWorker(task)
    }

    putBackWorker = (worker) => {
        this.pool.push(worker);
    }

/** Waits for a worker thread to complete its execution and resolves the waiting task's promise.
* @async * @param {WaitingTask} task - The task waiting for the worker thread's completion.
* @returns {Promise<void>} - A promise that resolves when the worker thread completes its execution.
*/ waitForWorker = async (task) => {
        return new Promise((resolve) => {
            task.resolve = resolve;
        });
    };

/** Handles queued worker tasks by executing them in available worker threads.
* If there are more tasks in the queue and available workers in the pool,
* it continues processing tasks recursively.
* @async * @returns {Promise<void>} - A promise that resolves when all queued tasks are processed.
*/ handleQueuedWorkerTask = async () => {
        // Check if there are tasks in the queue and available workers in the pool
        if (this.taskQueue.length > 0 && this.pool.length > 0) {
            // Get the next task from the queue
            const task /** @type {WorkerTask} */ = this.taskQueue.shift();
            if (task) await this.runTask(task);// Execute the task in an available worker thread
            // Continue processing queued tasks recursively
            await this.handleQueuedWorkerTask();
        }
    };
    
/** Handles and executes a task using available worker threads.
* @async * @param {WorkerTask} task - The task to be executed in a worker thread.
* @returns {Promise<{ status: number, result?: any, worker?: string, err?: Error }>} - A promise representing the status and result of the task execution.
*/ runTask = async (task) => {
        const { fn } = task;
        try {
            const { worker, id } = await this.getWorker();
            if (!worker) {
                await this.addTaskQueue(task);
                return { status: 202 };
            }
            try {
                const requestInput = { init: true, fn };
                const result = await this.executeWorkerTask(worker, requestInput);
                const ret = { status: 200, result };
                if (this.returnWorker) ret.worker = id
                return { status: 200, result };
            } catch (/** @type {*} */ err) {
                return { status: 300, err };
            } finally {
                this.putBackWorker({ worker, id });
                await this.handleQueuedWorkerTask(); // Check for Queued tasks
            }
        } catch (/** @type {*} */ err) {
            return { status: 300, err };
        }
    };
}

module.exports = WorkerPool;