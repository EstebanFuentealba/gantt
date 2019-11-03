import { createSVG } from './svg_utils';

export default class Arrow {
    constructor(gantt, from_task, to_task) {
        this.gantt = gantt;
        this.from_task = from_task;
        this.to_task = to_task;

        this.calculate_path();
        this.draw();
    }

    calculate_path() {
        // let start_x =
        //     this.from_task.$bar.getX() + this.from_task.$bar.getWidth() / 2;
        // const condition = () =>
        //     this.to_task.$bar.getX() < start_x + this.gantt.options.padding &&
        //     start_x > this.from_task.$bar.getX() + this.gantt.options.padding;

        // while (condition()) {
        //     start_x -= 10;
        // }

        // const start_y =
        //     this.gantt.options.header_height +
        //     this.gantt.options.bar_height +
        //     (this.gantt.options.padding + this.gantt.options.bar_height) *
        //         this.from_task.task._index +
        //     this.gantt.options.padding;

        // const end_x = this.to_task.$bar.getX() - this.gantt.options.padding / 2;
        // const end_y =
        //     this.gantt.options.header_height +
        //     this.gantt.options.bar_height / 2 +
        //     (this.gantt.options.padding + this.gantt.options.bar_height) *
        //         this.to_task.task._index +
        //     this.gantt.options.padding;

        // const from_is_below_to =
        //     this.from_task.task._index > this.to_task.task._index;
        // const curve = this.gantt.options.arrow_curve;
        // const clockwise = from_is_below_to ? 1 : 0;
        // const curve_y = from_is_below_to ? -curve : curve;
        // const offset = from_is_below_to
        //     ? end_y + this.gantt.options.arrow_curve
        //     : end_y - this.gantt.options.arrow_curve;

        // this.path = `
        //     M ${start_x} ${start_y}
        //     V ${offset}
        //     a ${curve} ${curve} 0 0 ${clockwise} ${curve} ${curve_y}
        //     L ${end_x} ${end_y}
        //     m -5 -5
        //     l 5 5
        //     l -5 5`;

        // if (
        //     this.to_task.$bar.getX() <
        //     this.from_task.$bar.getX() + this.gantt.options.padding
        // ) {
        //     const down_1 = this.gantt.options.padding / 2 - curve;
        //     const down_2 =
        //         this.to_task.$bar.getY() +
        //         this.to_task.$bar.getHeight() / 2 -
        //         curve_y;
        //     const left = this.to_task.$bar.getX() - this.gantt.options.padding;

        //     this.path = `
        //         M ${start_x} ${start_y}
        //         v ${down_1}
        //         a ${curve} ${curve} 0 0 1 -${curve} ${curve}
        //         H ${left}
        //         a ${curve} ${curve} 0 0 ${clockwise} -${curve} ${curve_y}
        //         V ${down_2}
        //         a ${curve} ${curve} 0 0 ${clockwise} ${curve} ${curve_y}
        //         L ${end_x} ${end_y}
        //         m -5 -5
        //         l 5 5
        //         l -5 5`;
        // }

        const borderRadius = 5;
        const start_y = this.from_task.y + 10;
        const start_x =
            this.from_task.$bar.getX() + this.from_task.$bar.getWidth() + 10;

        const condition = () => {
            return (
                this.to_task.$bar.getX() <
                    start_x + this.gantt.options.padding * 2 &&
                start_x + this.gantt.options.padding * 2 >
                    this.from_task.$bar.getX()
            );
        };

        // const end_x = this.from_task.width - this.to_task.width;
        const end_x =
            this.to_task.$bar.getX() - this.gantt.options.padding / 2 - 10;
        const end_y =
            this.gantt.options.header_height +
            this.gantt.options.bar_height / 2 +
            (this.gantt.options.padding + this.gantt.options.bar_height) *
                this.to_task.task._index;

        const down_1 = this.gantt.options.padding / 2;
        const down_2 =
            this.to_task.$bar.getY() + this.to_task.$bar.getHeight() / 2;
        this.path = `M ${start_x} ${start_y} 
            l 10,0 
            a ${borderRadius},${borderRadius} 90 0,1 ${borderRadius},${borderRadius}
            l 0,10
            a ${borderRadius},${borderRadius} 90 0,1 -${borderRadius},${borderRadius}
            L ${end_x},${end_y}
            a ${borderRadius},${borderRadius} 90 0,0 -${borderRadius},${borderRadius}
            l 0,10
            a ${borderRadius},${borderRadius} 90 0,0 ${borderRadius},${borderRadius}
            l 10,0
            m -5 -5
            l 5 5
            l -5 5`;

        console.log('condigo', this.to_task.task.id, condition());

        const heightBar =
            this.gantt.options.bar_height + this.gantt.options.padding;
        const heightCurrentBar = end_y - start_y + this.gantt.options.padding;
        if (heightCurrentBar > heightBar) {
            if (end_x > heightCurrentBar) {
                this.path = `M ${start_x} ${start_y} 
                l 10,0 
                a ${borderRadius},${borderRadius} 90 0,1 ${borderRadius},${borderRadius}
                l 0,10
                a ${borderRadius},${borderRadius} 90 0,1 -${borderRadius},${borderRadius}
                L ${end_x - 4},${start_y +
                    this.gantt.options.padding / 2 +
                    this.gantt.options.bar_height / 2 +
                    1}
                a ${borderRadius},${borderRadius} 90 0,0 -${borderRadius},${borderRadius}
                l 0,10
                L ${end_x - this.gantt.options.padding / 2},${end_y + 15}
                a ${borderRadius},${borderRadius} 90 0,0 ${borderRadius},${borderRadius}
                l 10,0
                m -5 -5
                l 5 5
                l -5 5`;
            }
            if (!condition()) {
                this.path = `M ${start_x} ${start_y} 
                l 10,0 
                a ${borderRadius},${borderRadius} 90 0,1 ${borderRadius},${borderRadius}
                l 0,10
                l 0, ${heightCurrentBar - this.gantt.options.padding}
                a ${borderRadius},${borderRadius} 90 0,0 ${borderRadius},${borderRadius}
                L ${end_x + this.gantt.options.padding / 2},${end_y + 20}
                m -5 -5
                l 5 5
                l -5 5`;
            }
        } else {
            if (!condition()) {
                this.path = `M ${start_x} ${start_y} 
                l 10,0 
                a ${borderRadius},${borderRadius} 90 0,1 ${borderRadius},${borderRadius}
                l 0,30
                a ${borderRadius},${borderRadius} 90 0,0 ${borderRadius},${borderRadius}
                L ${end_x},${end_y + 20}
                m -5 -5
                l 5 5
                l -5 5`;
            }
        }
    }

    draw() {
        // const start_y = this.from_task.y + 10;
        // const start_x = this.from_task.width + this.from_task.x + 10;

        // const end_x =
        //     this.to_task.$bar.getX() - this.gantt.options.padding / 2 - 10;
        // const end_y =
        //     this.gantt.options.header_height +
        //     this.gantt.options.bar_height / 2 +
        //     (this.gantt.options.padding + this.gantt.options.bar_height) *
        //         this.to_task.task._index;

        // const down_1 = this.gantt.options.padding / 2;
        // const down_2 =
        //     this.to_task.$bar.getY() + this.to_task.$bar.getHeight() / 2;
        // this.path = `M ${start_x} ${start_y}
        //     l 10,0
        //     a 5,5 90 0,1 5,5
        //     l 0,10
        //     a 5,5 90 0,1 -5,5
        //     L ${end_x},${end_y}
        //     a 5,5 90 0,0 -5,5
        //     l 0,10
        //     a 5,5 90 0,0 5,5
        //     l 10,0`;

        // const heightBar =
        //     this.gantt.options.bar_height + this.gantt.options.padding;
        // const heightCurrentBar = end_y - start_y + this.gantt.options.padding;
        // if (heightCurrentBar > heightBar) {
        //     const down_1 = this.gantt.options.padding / 2;
        //     const down_2 =
        //         this.to_task.$bar.getY() + this.to_task.$bar.getHeight() / 2;
        //     this.path = `M ${start_x} ${start_y}
        //         l 10,0
        //         a 5,5 90 0,1 5,5
        //         l 0,10
        //         a 5,5 90 0,1 -5,5
        //         l -${heightCurrentBar},0
        //         a 5,5 90 0,0 -5,5
        //         L ${end_x - 4},${end_y + 15}
        //         a 5,5 90 0,0 5,5
        //         l 10,0`;
        // }
        this.element = createSVG('path', {
            d: this.path,
            'data-from': this.from_task.task.id,
            'data-to': this.to_task.task.id
        });
    }

    update() {
        this.calculate_path();
        this.element.setAttribute('d', this.path);
    }
}
