import { requestIdleCallback, cancelIdleCallback } from 'idle-callback';

import { IDestroyable } from './idestroyable';

export type InitFn<T> = () => T;

export interface IIdleProperty<T> {
    getValue(): T;
    setValue(value: T): void;
}

export class IdleProperty<T> implements IIdleProperty<T>, IDestroyable {
    private _idleCallbackId: number | null = null;
    private _initFn: InitFn<T>;
    private _value!: T;

    public constructor(initFn: InitFn<T>) {
        this._initFn = initFn;
        this._idleCallbackId = requestIdleCallback(() => {
            this._value = this._initFn();
        });
    }

    public destroy(): void {
        this._cancelIdleCallback();
        delete this._initFn;
        delete this._value;
    }

    public getValue(): T {
        const value = this._value;
        if (value === undefined) {
            this._value = this._initFn();
            return this._value;
        }

        return value;
    }

    public setValue(value: T): void {
        this._cancelIdleCallback();
        this._value = value;

        // initFn no needed anymore
        delete this._initFn;
    }

    private _cancelIdleCallback(): void {
        const idleCallbackId = this._idleCallbackId;
        if (idleCallbackId !== null) {
            cancelIdleCallback(idleCallbackId);
            this._clearIdleCallback();
        }
    }

    private _clearIdleCallback(): void {
        this._idleCallbackId = null;
    }
}
