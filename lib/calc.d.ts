import { Coord } from './observables';
export declare class CalcMixin {
    side: 'left' | 'right';
    range: [number, number];
    calcIsInRange({ clientX }: Coord, opened: boolean): boolean;
    calcIsSwipe({ clientX: startX }: Coord, { clientX: endX }: Coord, translateX: number, drawerWidth: number, _: number): boolean;
    calcWillOpen(_: {}, __: {}, translateX: number, drawerWidth: number, velocity: number): boolean;
    calcTranslateX({ clientX: moveX }: Coord, { clientX: startX }: Coord, startTranslateX: number, drawerWidth: number): number;
}
//# sourceMappingURL=calc.d.ts.map