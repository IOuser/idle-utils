import { Job } from './job';

jest.useFakeTimers();

describe('Job', () => {
    it('should work!!1', () => {
        const prePerformCallback = jest.fn();
        const performCallback = jest.fn();
        const commitCallback = jest.fn();
        const postCommitCallback = jest.fn();

        const job = new Job({
            tasks: [1, 2, 3, 4, 5],
            state: [],
            prePerformCallback,
            performCallback,
            commitCallback,
            postCommitCallback,
        });

        job.start();

        expect(prePerformCallback).not.toBeCalled();
        expect(performCallback).not.toBeCalled();
        expect(commitCallback).not.toBeCalled();
        expect(postCommitCallback).not.toBeCalled();

        jest.runAllTimers();

        expect(prePerformCallback).toBeCalled();

        expect(performCallback).toBeCalled();
        expect(performCallback).toBeCalledTimes(5);
        expect(performCallback).toHaveBeenNthCalledWith(1, 1, []);
        expect(performCallback).toHaveBeenNthCalledWith(2, 2, []);
        expect(performCallback).toHaveBeenNthCalledWith(3, 3, []);
        expect(performCallback).toHaveBeenNthCalledWith(4, 4, []);
        expect(performCallback).toHaveBeenNthCalledWith(5, 5, []);

        expect(commitCallback).toBeCalled();
        expect(commitCallback).toHaveBeenCalledWith([]);

        expect(postCommitCallback).toBeCalled();
    });
});
