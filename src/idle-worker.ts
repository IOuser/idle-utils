import { requestIdleCallback, cancelIdleCallback, IdleDeadline } from 'idle-callback';

import { IDestroyable } from './idestroyable';

const enum Constants {
    Timeout = 250,
}

export interface IIdleWorker extends IDestroyable {
    start(): void;
    stop(): void;
    isRunning(): boolean;
}

export type IdleWorkerOptions<T, S> = {
    timeout?: number;
    initTasks: () => T[];
    initState: () => S;
    prePerformCallback?: () => void;
    performCallback: (task: T, state: S, context: IdleWorker<T, S>) => void;
    commitCallback: (state: S) => void;
    postCommitCallback?: (state: S) => void;
};

export class IdleWorker<T, S> implements IIdleWorker, IDestroyable {
    private _options: IdleWorkerOptions<T, S>;
    private _tasks: T[];
    private _state: S;

    private _performCallbackId: number | null = null;
    private _commitCallbackId: number | null = null;

    public constructor(options: IdleWorkerOptions<T, S>) {
        this._options = {
            ...options,
            timeout: options.timeout != null ? options.timeout : Constants.Timeout,
        };

        this._tasks = options.initTasks();
        this._state = options.initState();
    }

    public destroy(): void {
        this.stop();
        delete this._options;
    }

    public start(): void {
        if (this.isRunning()) {
            this.stop();
        }

        // TODO: Should enqueue prePerformCallback?
        const { prePerformCallback } = this._options;
        if (prePerformCallback !== undefined) {
            prePerformCallback();
        }

        this._schedulePerform();
    }

    public stop(): void {
        this._cancelPerformCallback();
        this._cancelCommitCallback();
    }

    public isRunning(): boolean {
        return this._performCallbackId !== null || this._commitCallbackId !== null;
    }

    public setTasks(tasks: T[]): void {
        this._tasks = tasks;
    }

    public getTasks(): T[] {
        return this._tasks;
    }

    public setState(state: S): void {
        this._state = state;
    }

    public getState(): S {
        return this._state;
    }

    public endPerform(): void {
        this.setTasks([]);
    }

    private _perform = (deadline: IdleDeadline) => {
        this._clearPerformCallback();

        const tasks = this._tasks;
        const state = this._state;
        const { performCallback } = this._options;

        while (this._shouldPerform(deadline)) {
            const task = tasks.shift();
            if (task === undefined) {
                continue;
            }

            performCallback(task, state, this);
            this._scheduleCommit();
        }

        if (this._hasPendingTasks()) {
            this._schedulePerform();
        }
    };

    private _shouldPerform(deadline: IdleDeadline, minTaskTime: number = 0): boolean {
        // If idle callback being invoked because the timeout
        // interval (deadline.didTimeout) expired then perform all tasks to avoid throttle
        const isTimeRemain = deadline.timeRemaining() > minTaskTime || deadline.didTimeout;
        return isTimeRemain && this._hasPendingTasks();
    }

    private _hasPendingTasks(): boolean {
        return this._tasks.length > 0;
    }

    private _scheduleCommit(): void {
        if (this._commitCallbackId === null) {
            this._commitCallbackId = requestAnimationFrame(this._commit);
        }
    }

    private _schedulePerform(): void {
        if (this._performCallbackId === null) {
            const { timeout } = this._options;
            this._performCallbackId = requestIdleCallback(this._perform, { timeout });
        }
    }

    private _cancelPerformCallback(): void {
        const performCallbackId = this._performCallbackId;
        if (performCallbackId !== null) {
            cancelIdleCallback(performCallbackId);
            this._clearPerformCallback();
        }
    }

    private _clearPerformCallback(): void {
        this._performCallbackId = null;
    }

    private _cancelCommitCallback(): void {
        const commitCallbackId = this._commitCallbackId;
        if (commitCallbackId !== null) {
            cancelAnimationFrame(commitCallbackId);
            this._clearCommitCallback();
        }
    }

    private _clearCommitCallback(): void {
        this._commitCallbackId = null;
    }

    // TODO: Improve commit logic by adding two commit strategies
    // 1. Single commit
    // 2. Progressive commiting
    private _commit = () => {
        this._clearCommitCallback();

        const state = this._state;
        const { commitCallback, postCommitCallback } = this._options;
        commitCallback(state);

        if (postCommitCallback !== undefined) {
            postCommitCallback(state);
        }
    };
}
