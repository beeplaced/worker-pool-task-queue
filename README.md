# worker-pool-task-queue

This library provides a solution for managing concurrent tasks in a Node.js environment. It leverages a combination of worker threads organized into a pool and a task queue system to efficiently execute tasks, ensuring optimal utilization of system resources and enhancing application performance.

## Table of Contents
<!-- no toc -->
  - [About](#about)
  - [Installation and usage](#installation-and-usage)
  - [Support](#support)


## About

The library is specifically designed for Node.js environments and is based upon the native worker_threads module.

* Worker Pool Management:

The library creates a pool of worker threads with a specified size. Workers are managed efficiently, ensuring they are available for processing tasks when needed.

* Task Queue System:

Implements a task queue mechanism to handle tasks that cannot be immediately processed due to the unavailability of worker threads.
Queued tasks are executed in a sequential manner, preventing overload and ensuring reliable task execution.

* Dynamic Worker Pool Scaling:

Dynamically scales the worker pool size based on demand, ensuring optimal resource utilization.
New workers are added to the pool as needed, allowing the system to handle increased workloads effectively.


## Installation and usage

  * Install the Worker Pool Module

First, install the worker-pool-task-queue module using npm:

```js
$ npm install worker-pool-task-queue
```

  * Create a Worker Pool

Import the WorkerPool class from the installed module and set up a worker pool with a specific pool size, worker script file path, and maximum number of workers:

```js
const WorkerPool = require('worker-pool-task-queue');
const path = require('path');

// Create a worker pool with 5 workers, using 'Worker.js' as the worker script
const pool = new WorkerPool(poolSize = 5, path.join(__dirname, 'Worker.js'), maxWorkers = 15);
```

  * Create the Worker.js File in ypur repro containing your functions. Note that functions can be handled in external libraries and classes (fn is representative for your functions, used with a delay in the example)


```js
const { parentPort } = require('worker_threads');

parentPort.on('message', async (message) => {
    const { fn } = message;
    // execute 'myfunc' here, return result in postMessage
    setTimeout(() => {
        parentPort.postMessage({ executed: `function ${fn} true` });
    }, 1000);
});
```

  * Define and Execute Tasks

Create functions to execute tasks using the worker pool. For example, you can define an executeTask function that runs a specific function called 'myfunc' in the worker pool:

```js
async function executeTask() {
    try {
        const result = await pool.runTask({ fn: 'myfunc', params: { set: true } });
        console.log(result);
    } catch (error) {
        console.error(error);
    }
}
```

You can then call this function multiple times using a loop or any other logic as needed:

```js
async function executeTasksMultipleTimes() {
    for (let i = 0; i < 4; i++) {
        await executeTask();
    }
}

executeTasksMultipleTimes();
```
## Support

This library used jsdoc types and is tested in Chrome
