import * as elysia0 from "elysia";
import { Elysia } from "elysia";
import * as elysia_types0 from "elysia/types";

//#region src/index.d.ts

/**
 * Interface for background tasks that can be executed asynchronously.
 */
interface IBackgroundTask {
  /**
   * Executes the background task.
   *
   * @returns Promise that resolves when task completes successfully
   * @throws Error if task execution fails
   */
  run(): Promise<void>;
}
/**
 * Custom error class to wrap task execution errors with task details.
 * @property error - The original error that was thrown
 * @property task - The BackgroundTask instance that failed
 */
declare class BackgroundTaskError extends Error {
  readonly error: unknown;
  readonly task: BackgroundTask<any[]>;
  constructor(error: unknown, task: BackgroundTask<any[]>);
}
/**
 * Function type for background tasks. Only async functions are supported.
 *
 * @template P - Parameter types for the task function
 */
type TaskFunction<P extends any[]> = (...args: P) => void | Promise<void>;
/**
 * Configuration options for the background task plugin.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const app = new Elysia().use(background({
 *   onError: (error) => console.error('Task failed:', error)
 * }));
 * ```
 */
type BackgroundOptions = {
  /**
   * Error handler for failed background tasks. Defaults to console logging if not provided.
   * @param event - The error event object containing error and task
   * @returns void or Promise<void>
   */
  onError?: (event: {
    error: unknown;
    task?: BackgroundTask<any[]>;
  }) => void | Promise<void>;
};
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
declare class BackgroundTask<P extends any[]> implements IBackgroundTask {
  /** The function to execute */
  readonly func: TaskFunction<P>;
  /** Arguments for the function */
  readonly args: P;
  /** Whether the function is async */
  readonly isAsync: boolean;
  /**
   * Creates a new BackgroundTask.
   *
   * @param func - The async function to execute
   * @param args - Arguments to pass to the function
   */
  constructor(func: TaskFunction<P>, ...args: P);
  /**
   * Executes the background task.
   *
   * @returns Promise that resolves when execution completes
   * @throws Error if function is not async
   */
  run(): Promise<void>;
}
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
declare class BackgroundTasks implements IBackgroundTask {
  /** Array of background tasks */
  private tasks;
  /**
   * Creates a new BackgroundTasks instance.
   *
   * @param tasks - Initial tasks (optional)
   */
  constructor(tasks?: BackgroundTask<any[]>[]);
  /**
   * Adds a background task to the queue.
   *
   * @template P - Parameter types for the task function
   * @param func - The async function to execute
   * @param args - Arguments to pass to the function
   */
  addTask<P extends any[]>(func: TaskFunction<P>, ...args: P): void;
  /**
   * Executes all tasks sequentially.
   * If one task fails, execution stops and the error is thrown.
   *
   * @returns Promise that resolves when all tasks complete
   * @throws Error if any task fails
   */
  run(): Promise<void>;
}
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
declare function background(options?: BackgroundOptions): Elysia<"", {
  decorator: {};
  store: {};
  derive: {};
  resolve: {};
}, {
  typebox: {};
  error: {};
}, {
  schema: {};
  standaloneSchema: {};
  macro: {};
  macroFn: {};
  parser: {};
}, {}, {
  derive: {
    readonly backgroundTasks: BackgroundTasks;
  };
  resolve: {};
  schema: elysia0.MergeSchema<{}, {}, "">;
  standaloneSchema: elysia_types0.PrettifySchema<{}>;
}, {
  derive: {};
  resolve: {};
  schema: {};
  standaloneSchema: {};
}>;
//#endregion
export { BackgroundOptions, BackgroundTask, BackgroundTaskError, BackgroundTasks, IBackgroundTask, background };