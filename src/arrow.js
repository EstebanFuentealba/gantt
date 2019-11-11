import { $, createSVG } from './svg_utils';

export default class Arrow {
    constructor(gantt, from_task, to_task) {
        this.gantt = gantt;
        this.from_task = from_task;
        this.to_task = to_task;

        this.calculate_path();
        this.draw();
        this.bind();
    }

    calculate_path() {
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
    bind() {
        this.setup_click_event();
    }
    on_context_menu(e) {
        e.preventDefault();
        this.gantt.trigger_event('contextmenu', [
            e,
            'link',
            [this.from_task, this.to_task],
            this
        ]);
    }
    setup_click_event() {
        $.on(this.group, 'contextmenu', this.on_context_menu.bind(this));
    }
    stop_click_event() {
        $.off(this.group, 'contextmenu', this.on_context_menu.bind(this));
    }
    draw() {
        this.group = createSVG('g', {
            class: 'link-wrapper'
        });
        this.element = createSVG('path', {
            d: this.path,
            'data-from': this.from_task.task.id,
            'data-to': this.to_task.task.id,
            append_to: this.group
        });
    }

    update() {
        this.calculate_path();
        this.element.setAttribute('d', this.path);
    }
}
