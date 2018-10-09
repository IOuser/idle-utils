import { IdleWorker } from './idle-worker';

jest.useFakeTimers();

describe('IdleWorker', () => {
    it('should work!!1', () => {
        const prePerformCallback = jest.fn();
        const performCallback = jest.fn();
        const commitCallback = jest.fn();
        const postCommitCallback = jest.fn();

        const worker = new IdleWorker<number, any[]>({
            initTasks: () => [1, 2, 3, 4, 5],
            initState: () => [],
            prePerformCallback,
            performCallback,
            commitCallback,
            postCommitCallback,
        });

        worker.start();

        expect(prePerformCallback).toBeCalled();

        jest.runAllTimers();

        expect(performCallback).toBeCalledTimes(5);
        expect(performCallback).toHaveBeenNthCalledWith(1, 1, [], worker);
        expect(performCallback).toHaveBeenNthCalledWith(2, 2, [], worker);
        expect(performCallback).toHaveBeenNthCalledWith(3, 3, [], worker);
        expect(performCallback).toHaveBeenNthCalledWith(4, 4, [], worker);
        expect(performCallback).toHaveBeenNthCalledWith(5, 5, [], worker);

        expect(commitCallback).toHaveBeenCalledWith([]);

        expect(postCommitCallback).toBeCalled();
    });
});
