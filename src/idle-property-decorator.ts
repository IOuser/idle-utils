import { IdleProperty } from './idle-property';

export function idleProperty<T>(initFn: () => T): PropertyDecorator {
    return (target: any, propertyKey: string | symbol) => {
        const idleProp = new IdleProperty(initFn);

        Object.defineProperty(target, propertyKey, {
            configurable: true,
            get(): T {
                return idleProp.getValue();
            },
            set(value: T): void {
                idleProp.destroy();

                delete target[propertyKey];
                target[propertyKey] = value;
            },
        });
    };
}
