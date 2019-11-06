import { createSVG } from './svg_utils';
import Arrow from './arrow';

export default class ArrowRect extends Arrow {
    calculate_path() {
        const start_y = this.from_task.y + 10;
        const start_x =
            this.from_task.$bar.getX() + this.from_task.$bar.getWidth() + 10;

        const is_top_to_bottom = () =>
            this.from_task.y < this.to_task.$bar.getY();
        const condition = () => {
            console.log(
                this.to_task.$bar.getX(),
                '<',
                start_x - 10 + this.gantt.options.padding * 2
            );
            console.log(
                start_x - 10 + this.gantt.options.padding * 2,
                '>',
                this.from_task.$bar.getX() - 10
            );
            return (
                this.to_task.$bar.getX() <
                    start_x - 10 + this.gantt.options.padding * 2 &&
                start_x - 10 + this.gantt.options.padding * 2 >
                    this.from_task.$bar.getX() - 10
            );
        };
        const end_x =
            this.to_task.$bar.getX() - this.gantt.options.padding / 2 - 10;
        const end_y =
            this.gantt.options.header_height +
            this.gantt.options.bar_height / 2 +
            (this.gantt.options.padding + this.gantt.options.bar_height) *
                this.to_task.task._index;

        if (is_top_to_bottom()) {
            this.path = `M ${start_x - 10} ${start_y} 
                l 10,0 
                l 0,20
                L ${end_x},${end_y}
                l 0,20
                l 15,0
                m -5 -5
                l 5 5
                l -5 5`;
        } else {
            this.path = `M ${start_x - 10} ${start_y}
                l 10,0
                l 0,-20
                L ${end_x},${start_y - this.gantt.options.bar_height}
                l 0,-${this.gantt.options.padding - 2}
                l 15,0
                m -5 -5
                l 5 5
                l -5 5`;
        }

        const heightBar =
            this.gantt.options.bar_height + this.gantt.options.padding;
        const heightCurrentBar = end_y - start_y + this.gantt.options.padding;
        console.log(
            'heightCurrentBar',
            this.from_task.task.id,
            '->',
            this.to_task.task.id,
            heightCurrentBar,
            heightBar
        );
        if (is_top_to_bottom()) {
            if (heightCurrentBar > heightBar) {
                if (end_x > heightCurrentBar) {
                    this.path = `M ${start_x - 10} ${start_y}
                        l 10,0
                        l 0,20
                        L ${end_x},${start_y +
                        this.gantt.options.padding / 2 +
                        this.gantt.options.bar_height / 2 +
                        1}
                        L ${end_x},${end_y + 15}
                        l 0, 5
                        l 15,0
                        m -5 -5
                        l 5 5
                        l -5 5`;
                }
                if (!condition()) {
                    this.path = `M ${start_x - 10} ${start_y}
                        l 10,0
                        l 0,20
                        l 0, ${heightCurrentBar - this.gantt.options.padding}
                        l 5,0
                        L ${end_x +
                            5 +
                            this.gantt.options.padding / 2},${end_y + 20}
                        m -5 -5
                        l 5 5
                        l -5 5`;
                }
            } else {
                if (!condition()) {
                    this.path = `M ${start_x - 10} ${start_y}
                    l 10,0
                    l 0,40
                    L ${end_x + 15},${end_y + 20}
                    m -5 -5
                    l 5 5
                    l -5 5`;
                }
            }
        } else if (!is_top_to_bottom()) {
            if (heightCurrentBar < heightBar) {
                this.path = `M ${start_x - 10} ${start_y}
                        l 10,0
                        l 0,20
                        L ${end_x},${start_y +
                    this.gantt.options.padding / 2 +
                    this.gantt.options.bar_height / 2}
                        L ${end_x},${end_y + 20}
                       
                        l 15,0
                        m -5 -5
                        l 5 5
                        l -5 5`;
                if (!condition()) {
                    this.path = `M ${start_x - 10} ${start_y}
                                l 20,0
                                l ${(end_x - start_x) / 2 - 5},0
                                l 0, ${heightCurrentBar + 2}
                                l 5,0
                                L ${end_x +
                                    5 +
                                    this.gantt.options.padding / 2},${end_y +
                        20}
                                m -5 -5
                                l 5 5
                                l -5 5`;
                }
            } else {
                if (!condition()) {
                    this.path = `M ${start_x - 10} ${start_y}
                    l 10,0
                    l 0,-36
                    L ${end_x + 15},${start_y -
                        this.gantt.options.header_height +
                        this.gantt.options.bar_height / 2 +
                        4}
                    m -5 -5
                    l 5 5
                    l -5 5`;
                }
            }
        }
    }
}
