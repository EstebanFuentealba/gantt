import { createSVG } from './svg_utils';
import date_utils from './date_utils';

export default class Marker {
    constructor(gantt, marker) {
        this.set_defaults(gantt, marker);
        this.prepare();
        this.draw();
    }
    set_defaults(gantt, marker) {
        this.gantt = gantt;
        this.marker = marker;
    }
    prepare() {
        this.prepare_values();
    }
    prepare_values() {
        this.x = this.compute_x();

        this.group = createSVG('g', {
            class: 'markers'
        });
    }
    compute_x() {
        const { step, column_width } = this.gantt.options;
        const time = this.marker.time;
        const gantt_start = this.gantt.gantt_start;

        const diff = date_utils.diff(time, gantt_start, 'hour');
        let x = diff / step * column_width;

        if (this.gantt.view_is('Month')) {
            const diff = date_utils.diff(time, gantt_start, 'day');
            x = diff * column_width / 30;
        }
        return x;
    }
    setMarker(marker) {
        this.marker = marker;
        this.x = this.compute_x();
        this.update_marker_position();
    }
    update_marker_position() {
        const marker = this.group.querySelector('.marker-today');
        const markerBox = this.group.querySelector('.marker-box');
        const markerText = this.group.querySelector('.marker-text');
        console.log(marker);
        marker.setAttribute('x1', this.x);
        marker.setAttribute('x2', this.x);
        markerBox.setAttribute('x', this.x);
        markerText.setAttribute('x', this.x);
    }
    draw() {
        this.draw_marker();
    }
    draw_marker() {
        createSVG('line', {
            x1: this.x,
            x2: this.x,
            y1: 0,
            y2: '100%',
            class: 'marker-today',
            append_to: this.group
        });
        const markerTextGroup = createSVG('g', {
            transform: 'translate(0,10)',
            append_to: this.group
        });

        const box = createSVG('rect', {
            class: 'marker-box',
            x: this.x,
            y: 0,
            width: 50,
            height: 20,
            fill: '#e06671',
            append_to: markerTextGroup
        });

        const text = createSVG('text', {
            class: 'marker-text',
            fill: '#fff',
            x: this.x + 10,
            y: 14,
            innerHTML: this.marker.text,
            append_to: markerTextGroup
        });
    }
}
