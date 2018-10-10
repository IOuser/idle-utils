import { IDestroyable } from './idestroyable';

import { IdleWorker, IdleWorkerOptions, IIdleWorker } from './idle-worker';

export type CompoundIdleWorkerOptions<T, S> = IdleWorkerOptions<T, S> & {
    mergeState: (stateA: S, stateB: S) => S;
    subWorkersOptions: SubIdleWorkerOptions<T, S>[];
};

export type SubIdleWorkerOptions<T, S> = {
    getTasksToPerform: () => T[];
    getStateToPerform: () => S;
};

export class CompoundIdleWorker<T, S> implements IIdleWorker, IDestroyable {
    private _options: CompoundIdleWorkerOptions<T, S>;
    private _workers: IdleWorker<T, S>[] = [];

    private _state: S | null = null;

    private _commitCounter: number = 0;
    private _postCommitCounter: number = 0;

    public constructor(options: CompoundIdleWorkerOptions<T, S>) {
        this._options = options;
        this._initWorkers();
    }

    public destroy(): void {
        this._workers.forEach((worker: IdleWorker<T, S>) => worker.destroy());
        delete this._workers;
        delete this._options;
        delete this._state;
    }

    public start(): void {
        this._state = null;
        this._commitCounter = 0;
        this._postCommitCounter = 0;

        this._workers.forEach((worker: IdleWorker<T, S>) => worker.start());
    }

    public stop(): void {
        this._workers.forEach((worker: IdleWorker<T, S>) => worker.stop());
    }

    public isRunning(): boolean {
        return this._workers.some((worker: IdleWorker<T, S>) => worker.isRunning());
    }

    private _initWorkers(): void {
        const {
            subWorkersOptions,
            timeout,
            initTasks,
            initState,
            prePerformCallback,
            performCallback,
            mergeState,
            commitCallback,
            postCommitCallback,
        } = this._options;

        for (const { getTasksToPerform, getStateToPerform } of subWorkersOptions) {
            const worker = new IdleWorker({
                timeout,
                initTasks,
                initState,
                prePerformCallback: () => {
                    worker.setTasks(getTasksToPerform());
                    worker.setState(getStateToPerform());

                    if (prePerformCallback !== undefined) {
                        prePerformCallback();
                    }
                },
                performCallback,
                commitCallback: (state: S) => {
                    this._commitCounter++;

                    if (this._state === null) {
                        this._state = state;
                    } else {
                        this._state = mergeState(this._state, state);
                    }

                    if (this._commitCounter === this._workers.length) {
                        commitCallback(this._state);
                    }
                },
                postCommitCallback: () => {
                    this._postCommitCounter++;

                    if (this._state === null) {
                        console.log('postCommitCallback: state is null!');
                        return;
                    }

                    if (postCommitCallback !== undefined && this._postCommitCounter === this._workers.length) {
                        postCommitCallback(this._state);
                    }
                },
            });

            this._workers.push(worker);
        }
    }
}
