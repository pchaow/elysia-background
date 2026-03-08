let elysia = require("elysia");

//#region src/index.ts
/**
* Background Tasks Implementation
* Inspired by Starlette's background task processing
* @see https://github.com/encode/starlette/blob/master/starlette/background.py
*/
/**
* Custom error class to wrap task execution errors with task details.
* @property error - The original error that was thrown
* @property task - The BackgroundTask instance that failed
*/
var BackgroundTaskError = class extends Error {
	constructor(error, task) {
		super("Background task failed");
		this.error = error;
		this.task = task;
		this.name = "BackgroundTaskError";
	}
};
const isAsyncFunction = (func) => func.constructor.name === "AsyncFunction";
/**
* A background task that wraps an async function for execution.
*
* @template P - Parameter types for the task function
* @example
* ```typescript
* // Create and run a simple task
* const task = new BackgroundTask(async () => {
*   console.log('Task executed');
* });
* await task.run();
*
* // Task with parameters
* const emailTask = new BackgroundTask(
*   async (email: string, subject: string) => {
*     await sendEmail(email, subject);
*   },
*   "user@example.com",
*   "Welcome"
* );
* ```
*/
var BackgroundTask = class {
	/** The function to execute */
	func;
	/** Arguments for the function */
	args;
	/** Whether the function is async */
	isAsync;
	/**
	* Creates a new BackgroundTask.
	*
	* @param func - The async function to execute
	* @param args - Arguments to pass to the function
	*/
	constructor(func, ...args) {
		this.func = func;
		this.args = args;
		this.isAsync = isAsyncFunction(func);
	}
	/**
	* Executes the background task.
	*
	* @returns Promise that resolves when execution completes
	* @throws Error if function is not async
	*/
	async run() {
		if (this.isAsync) await this.func(...this.args);
		else throw new Error("Background task does not support synchronous functions. Please use async functions.");
	}
};
/**
* Collection of background tasks that execute sequentially.
* If one task fails, execution stops.
*
* @example
* ```typescript
* // Create task queue and add tasks
* const tasks = new BackgroundTasks();
*
* tasks.addTask(async () => {
*   console.log("First task");
* });
*
* tasks.addTask(async (name: string) => {
*   console.log(`Hello ${name}`);
* }, "World");
*
* // Execute all tasks
* await tasks.run();
* ```
*/
var BackgroundTasks = class {
	/** Array of background tasks */
	tasks;
	/**
	* Creates a new BackgroundTasks instance.
	*
	* @param tasks - Initial tasks (optional)
	*/
	constructor(tasks = []) {
		this.tasks = tasks;
	}
	/**
	* Adds a background task to the queue.
	*
	* @template P - Parameter types for the task function
	* @param func - The async function to execute
	* @param args - Arguments to pass to the function
	*/
	addTask(func, ...args) {
		const task = new BackgroundTask(func, ...args);
		this.tasks.push(task);
	}
	/**
	* Executes all tasks sequentially.
	* If one task fails, execution stops and the error is thrown.
	*
	* @returns Promise that resolves when all tasks complete
	* @throws Error if any task fails
	*/
	async run() {
		for (const task of this.tasks) try {
			await task.run();
		} catch (error) {
			throw new BackgroundTaskError(error, task);
		}
	}
};
/**
* Creates an Elysia plugin for background task processing.
* Tasks execute sequentially after the HTTP response is sent.
*
* @param options - Configuration options for error handling
* @returns Elysia plugin with background task functionality
*
* @example
* ```typescript
* // Basic usage
* const app = new Elysia()
*   .use(background())
*   .post('/users', ({ backgroundTasks, body }) => {
*     backgroundTasks.addTask(async () => {
*       await sendWelcomeEmail(body.email);
*     });
*     return { id: body.id, status: 'created' };
*   });
*
* // With custom error handling
* const app = new Elysia()
*   .use(background({
*     onError: ({ error }) => {
*       console.error('Background task failed:', error);
*       Sentry.captureException(error);
*     }
*   }))
*   .post('/process', ({ backgroundTasks }) => {
*     backgroundTasks.addTask(async () => {
*       await processData();
*     });
*     return { status: 'processing' };
*   });
* ```
*/
function background(options) {
	return new elysia.Elysia({
		name: "elysia-background",
		seed: options
	}).derive(() => ({ backgroundTasks: new BackgroundTasks() })).onAfterResponse(({ backgroundTasks }) => {
		backgroundTasks.run().catch(async (error) => {
			if (options?.onError) try {
				const result = options.onError(error instanceof BackgroundTaskError ? {
					error: error.error,
					task: error.task
				} : { error });
				if (result instanceof Promise) await result;
			} catch (handlerError) {
				console.error("[elysia-background] Error handler failed:", handlerError);
			}
			else {
				const actualError = error instanceof BackgroundTaskError ? error.error : error;
				console.error("[elysia-background] Task failed:", actualError);
			}
		});
	}).as("scoped");
}

//#endregion
exports.BackgroundTask = BackgroundTask;
exports.BackgroundTaskError = BackgroundTaskError;
exports.BackgroundTasks = BackgroundTasks;
exports.background = background;