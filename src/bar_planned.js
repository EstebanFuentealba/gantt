import date_utils from './date_utils';
import { $, createSVG, animateSVG } from './svg_utils';
import Bar from './bar';
export default class BarPlanned extends Bar {
    constructor(gantt, task) {
        super(gantt, task);
        this.set_defaults(gantt, task);
        this.prepare();
        this.draw();
    }
    compute_x() {
        const { step, column_width } = this.gantt.options;
        const task_start = this.task._planned_start;
        const gantt_start = this.gantt.gantt_start;

        const diff = date_utils.diff(task_start, gantt_start, 'hour');

        let x = diff / step * column_width;

        if (this.gantt.view_is('Month')) {
            const diff = date_utils.diff(task_start, gantt_start, 'day');
            x = diff * column_width / 30;
        }
        return x;
    }
    draw() {
        this.draw_bar_planned();
    }
    draw_bar_planned() {
        createSVG('rect', {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            rx: this.corner_radius,
            ry: this.corner_radius,
            class: 'planned',
            fill: 'url(#pinstripe)',
            append_to: this.group
        });
    }
}
