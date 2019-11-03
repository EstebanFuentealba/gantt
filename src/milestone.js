import date_utils from './date_utils';
import { $, createSVG, animateSVG } from './svg_utils';
import Bar from './bar';
export default class Milestone extends Bar {
    constructor(gantt, task) {
        super(gantt, task);
        this.set_defaults(gantt, task);
        this.prepare();
        this.draw();
    }

    set_defaults(gantt, task) {
        this.action_completed = false;
        this.gantt = gantt;
        this.task = task;
    }
    prepare() {
        this.prepare_values();
        this.prepare_helpers();
    }
    compute_x() {
        const { step, column_width } = this.gantt.options;
        const task_start = this.task._start;
        const gantt_start = this.gantt.gantt_start;

        const diff = date_utils.diff(task_start, gantt_start, 'hour');
        let x = diff / step * column_width;

        if (this.gantt.view_is('Month')) {
            const diff = date_utils.diff(task_start, gantt_start, 'day');
            x = diff * column_width / 30;
        }
        return x;
    }

    compute_y() {
        return (
            this.gantt.options.header_height +
            this.gantt.options.padding +
            this.task._index * (this.height + this.gantt.options.padding)
        );
    }

    prepare_values() {
        this.height = this.gantt.options.bar_height;
        this.x = this.compute_x();
        this.y = this.compute_y();
        this.group = createSVG('g', {
            class: 'bar-wrapper ' + (this.task.custom_class || ''),
            'data-id': this.task.id
        });
        this.bar_group = createSVG('g', {
            class: 'bar-group',
            append_to: this.group
        });
    }
    draw() {
        this.draw_bar();
        this.draw_label();
    }
    update_milestone_position() {
        this.$bar.setAttribute('x', this.$bar.getX());
        this.$bar.setAttribute(
            'd',
            `M${this.$bar.getX() + 10},${this.y + 2} 
            l -10,10 
            l 10,10
            l 10,-10
            l -10,-10`
        );
    }
    draw_label() {
        createSVG('text', {
            x: this.x,
            y: this.y + this.height / 2,
            innerHTML: this.task.name,
            class: 'bar-label',
            append_to: this.bar_group
        });
        // labels get BBox in the next tick
        requestAnimationFrame(() => this.update_label_position());
    }
    draw_bar() {
        this.$bar = createSVG('path', {
            x: this.x,
            y: this.y,
            width: 20,
            height: 20,
            d: `M${this.x + 10},${this.y + 2} 
            l -10,10 
            l 10,10
            l 10,-10
            l -10,-10`,
            class: 'milestone',
            append_to: this.bar_group
        });
    }
    update_label_position() {
        const bar = this.$bar,
            label = this.group.querySelector('.bar-label');

        label.classList.add('big');
        label.setAttribute('x', bar.getX() + bar.getWidth() + 5);
    }
    update_bar_position({ x = null, width = null }) {
        const bar = this.$bar;

        if (x) {
            // get all x values of parent task
            const xs = this.task.dependencies.map(dep => {
                return this.gantt.get_bar(dep).$bar.getX();
            });
            // child task must not go before parent
            const valid_x = xs.reduce((prev, curr) => {
                return x >= curr;
            }, x);
            if (!valid_x) {
                width = null;
                return;
            }
            this.update_attr(bar, 'x', x);
        }
        if (width && width >= this.gantt.options.column_width) {
            this.update_attr(bar, 'width', width);
        }
        this.update_milestone_position();
        this.update_label_position();
        this.update_arrow_position();
    }
}
