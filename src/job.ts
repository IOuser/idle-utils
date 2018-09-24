import { requestIdleCallback, cancelIdleCallback, IdleDeadline } from 'idle-callback';

import { IDestroyable } from './idestroyable';

export interface IJob {
    cancel: () => void;
    start: () => void;
}

export type JobOptions<T, S> = {
    tasks: T[];
    state: S;
    prePerformCallback?: () => void;
    performCallback: (task: T, state: S) => void;
    commitCallback: (state: S) => void;
    postCommitCallback?: (state: S) => void;
};

export class Job<T, S> implements IJob, IDestroyable {
    private _options: JobOptions<T, S>;

    private _idleCallbackId: number | null = null;
    private _animationFrameId: number | null = null;

    public constructor(options: JobOptions<T, S>) {
        this._options = options;
    }

    public start(): void {
        if (this.isPerforming()) {
            this.cancel();
        }

        this._idleCallbackId = requestIdleCallback(
            (deadline: IdleDeadline) => {
                const { prePerformCallback } = this._options;
                if (prePerformCallback !== undefined) {
                    prePerformCallback.call(this._options);
                }

                this._perform(deadline);
            },
            { timeout: 250 },
        );
    }

    public cancel(): void {
        const idleCallbackId = this._idleCallbackId;
        if (idleCallbackId !== null) {
            cancelIdleCallback(idleCallbackId);
            this._idleCallbackId = null;
        }

        const animationFrameId = this._animationFrameId;
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            this._animationFrameId = null;
        }
    }

    public destroy(): void {
        this.cancel();
        delete this._options;
    }

    public isPerforming(): boolean {
        return this._idleCallbackId !== null || this._animationFrameId !== null;
    }

    private _perform = (deadline: IdleDeadline) => {
        const { tasks, state, performCallback } = this._options;
        while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && tasks.length !== 0) {
            const task = tasks.shift();
            if (task === undefined) {
                continue;
            }

            performCallback(task, state);
            this._scheduleCommit();
        }

        if (tasks.length !== 0) {
            this._idleCallbackId = requestIdleCallback(this._perform, { timeout: 250 });
        } else {
            this._idleCallbackId = null;
        }
    };

    private _scheduleCommit(): void {
        if (this._animationFrameId === null) {
            this._animationFrameId = requestAnimationFrame(this._commit);
        }
    }

    private _commit = () => {
        const { state, commitCallback, postCommitCallback } = this._options;
        commitCallback(state);
        this._animationFrameId = null;

        if (postCommitCallback !== undefined) {
            postCommitCallback(state);
        }
    };
}
