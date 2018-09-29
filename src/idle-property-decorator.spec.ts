import { idleProperty } from './idle-property-decorator';

describe('IdleProperty', () => {
    it('should decorate property', () => {
        class A {
            @idleProperty(() => 42)
            public prop!: number;
        }

        const a = new A();
        expect(a.prop).toEqual(42);
    });

    it('should decorate property and evaluate when idle', () => {
        jest.useFakeTimers();
        class A {
            @idleProperty(() => 42)
            public prop!: number;
        }

        const a = new A();
        jest.runAllTimers();

        expect(a.prop).toEqual(42);
    });

    it('should destruct idle property after assigning new value to property', () => {
        class A {
            @idleProperty(() => 42)
            public prop!: number;
        }

        const a = new A();
        a.prop = 21;
        expect(a.prop).toEqual(21);
    });
});
