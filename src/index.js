import date_utils from './date_utils';
import { $, createSVG } from './svg_utils';
import Bar from './bar';
import ArrowRect from './arrow_rect';
import Arrow from './arrow';
import Popup from './popup';
import Marker from './marker';
import Task from './task';
import Milestone from './milestone';
import { throttle, findParentBySelector } from './utils';
import './gantt.scss';

if (!Element.prototype.matches) {
    Element.prototype.matches =
        Element.prototype.msMatchesSelector ||
        Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;

        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

//  https://www.wrike.com/gantt-chart/
export default class Gantt {
    constructor(wrapper, tasks, options) {
        this.setup_wrapper(wrapper);
        this.setup_options(options);
        this.setup_tasks(tasks);
        // initialize with default view mode
        this.change_view_mode();
        this.bind_events();
    }

    setup_wrapper(element) {
        let svg_element, wrapper_element;

        // CSS Selector is passed
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        // get the SVGElement
        if (element instanceof HTMLElement) {
            wrapper_element = element;
            svg_element = element.querySelector('svg');
        } else if (element instanceof SVGElement) {
            svg_element = element;
        } else {
            throw new TypeError(
                'Frappé Gantt only supports usage of a string CSS selector,' +
                    " HTML DOM element or SVG DOM element for the 'element' parameter"
            );
        }

        // svg element
        if (!svg_element) {
            // create it
            this.$svg = createSVG('svg', {
                append_to: wrapper_element,
                class: 'gantt'
            });
        } else {
            this.$svg = svg_element;
            this.$svg.classList.add('gantt');
        }

        // wrapper element
        this.$container = document.createElement('div');
        this.$container.classList.add('gantt-container');

        const parent_element = this.$svg.parentElement;
        parent_element.appendChild(this.$container);
        this.$container.appendChild(this.$svg);

        // popup wrapper
        this.popup_wrapper = document.createElement('div');
        this.popup_wrapper.classList.add('popup-wrapper');
        this.$container.appendChild(this.popup_wrapper);
    }

    setup_options(options) {
        options.groups = options.groups.reduce((dict, curr) => {
            dict[curr.id] = curr;
            return dict;
        }, {});
        const default_options = {
            header_height: 50,
            column_width: 30,
            step: 24,
            view_modes: [
                'Hour',
                'Quarter Day',
                'Half Day',
                'Day',
                'Week',
                'Month',
                'Year'
            ],
            bar_height: 20,
            bar_corner_radius: 3,
            arrow_curve: 5,
            padding: 18,
            view_mode: 'Day',
            date_format: 'YYYY-MM-DD',
            popup_trigger: 'click',
            custom_popup_html: null,
            header_fixed: false,
            groups: {},
            language: 'en'
        };
        this.options = Object.assign({}, default_options, options);
    }

    setup_tasks(tasks) {
        this.task_map = {};
        // prepare tasks
        this.tasks = tasks.map((task, i) => {
            // convert to Date objects
            task._start = date_utils.parse(task.start);
            task._end = date_utils.parse(task.end);

            // make task invalid if duration too large
            if (date_utils.diff(task._end, task._start, 'year') > 10) {
                task.end = null;
            }

            // cache index
            task._index = i;

            // invalid dates
            if (!task.start && !task.end) {
                const today = date_utils.today();
                task._start = today;
                task._end = date_utils.add(today, 2, 'day');
            }

            if (!task.start && task.end) {
                task._start = date_utils.add(task._end, -2, 'day');
            }

            if (task.start && !task.end) {
                task._end = date_utils.add(task._start, 2, 'day');
            }

            // if hours is not set, assume the last day is full day
            // e.g: 2018-09-09 becomes 2018-09-09 23:59:59
            const task_end_values = date_utils.get_date_values(task._end);
            if (task_end_values.slice(3).every(d => d === 0)) {
                task._end = date_utils.add(task._end, 24, 'hour');
            }

            // invalid flag
            if (!task.start || !task.end) {
                task.invalid = true;
            }

            // dependencies
            if (typeof task.dependencies === 'string' || !task.dependencies) {
                let deps = [];
                if (task.dependencies) {
                    deps = task.dependencies
                        .split(',')
                        .map(d => d.trim())
                        .filter(d => d);
                }
                task.dependencies = deps;
            }

            // uids
            if (!task.id) {
                task.id = generate_id(task);
            }
            // task group
            if (
                typeof task.group_id !== 'undefined' &&
                this.options.groups.hasOwnProperty(task.group_id)
            ) {
                task._group = this.options.groups[task.group_id];
            }
            let t = new Task(this, task);
            this.task_map[t.id] = t;
            return t;
        });

        this.setup_dependencies();
    }

    setup_dependencies() {
        this.dependency_map = {};
        for (let t of this.tasks) {
            for (let d of t.dependencies) {
                this.dependency_map[d] = this.dependency_map[d] || [];
                this.dependency_map[d].push(t.id);
            }
        }
    }

    refresh(tasks) {
        this.setup_tasks(tasks);
        this.change_view_mode();
    }

    change_view_mode(mode = this.options.view_mode) {
        this.update_view_scale(mode);
        this.setup_dates();
        this.render();
        // fire viewmode_change event
        this.trigger_event('view_change', [mode]);
    }

    update_view_scale(view_mode) {
        this.options.view_mode = view_mode;
        if (view_mode === 'Hour') {
            this.options.step = 24 / 24;
            this.options.column_width = 38;
        } else if (view_mode === 'Day') {
            this.options.step = 24;
            this.options.column_width = 38;
        } else if (view_mode === 'Half Day') {
            this.options.step = 24 / 2;
            this.options.column_width = 38;
        } else if (view_mode === 'Quarter Day') {
            this.options.step = 24 / 4;
            this.options.column_width = 38;
        } else if (view_mode === 'Week') {
            this.options.step = 24 * 7;
            this.options.column_width = 140;
        } else if (view_mode === 'Month') {
            this.options.step = 24 * 30;
            this.options.column_width = 120;
        } else if (view_mode === 'Year') {
            this.options.step = 24 * 365;
            this.options.column_width = 120;
        }
    }

    setup_dates() {
        this.setup_gantt_dates();
        this.setup_date_values();
    }

    setup_gantt_dates() {
        this.gantt_start = this.gantt_end = null;

        for (let task of this.tasks) {
            // set global start and end date
            if (!this.gantt_start || task._start < this.gantt_start) {
                this.gantt_start = task._start;
            }
            if (!this.gantt_end || task._end > this.gantt_end) {
                this.gantt_end = task._end;
            }
        }

        this.gantt_start = date_utils.start_of(this.gantt_start, 'day');
        this.gantt_end = date_utils.start_of(this.gantt_end, 'day');

        // add date padding on both sides
        if (this.view_is(['Hour', 'Quarter Day', 'Half Day'])) {
            this.gantt_start = date_utils.add(this.gantt_start, -7, 'day');
            this.gantt_end = date_utils.add(this.gantt_end, 7, 'day');
        } else if (this.view_is('Month')) {
            this.gantt_start = date_utils.start_of(this.gantt_start, 'year');
            this.gantt_end = date_utils.add(this.gantt_end, 1, 'year');
        } else if (this.view_is('Year')) {
            this.gantt_start = date_utils.add(this.gantt_start, -2, 'year');
            this.gantt_end = date_utils.add(this.gantt_end, 2, 'year');
        } else {
            this.gantt_start = date_utils.add(this.gantt_start, -1, 'month');
            this.gantt_end = date_utils.add(this.gantt_end, 1, 'month');
        }
    }

    setup_date_values() {
        this.dates = [];
        let cur_date = null;

        while (cur_date === null || cur_date < this.gantt_end) {
            if (!cur_date) {
                cur_date = date_utils.clone(this.gantt_start);
            } else {
                if (this.view_is('Year')) {
                    cur_date = date_utils.add(cur_date, 1, 'year');
                } else if (this.view_is('Month')) {
                    cur_date = date_utils.add(cur_date, 1, 'month');
                } else {
                    cur_date = date_utils.add(
                        cur_date,
                        this.options.step,
                        'hour'
                    );
                }
            }
            this.dates.push(cur_date);
        }
    }

    bind_events() {
        this.bind_grid_click();
        this.bind_bar_events();
    }

    render() {
        this.clear();
        this.setup_layers();
        this.make_grid();
        this.make_dates();
        this.make_bars();
        this.make_arrows();
        this.map_arrows_on_bars();
        this.set_width();
        this.set_scroll_position();
    }

    setup_layers() {
        this.layers = {};
        const layers = [
            'grid',
            'arrow',
            'progress',
            'bar',
            'details',
            'date',
            'markers'
        ];
        // make group layers
        for (let layer of layers) {
            this.layers[layer] = createSVG('g', {
                class: layer,
                append_to: this.$svg
            });
        }
    }

    make_grid() {
        this.make_grid_background();
        this.make_grid_rows();
        this.make_grid_header();
        this.make_grid_ticks();
        this.make_grid_highlights();
    }

    make_grid_background() {
        const grid_width = this.dates.length * this.options.column_width;
        const grid_height =
            this.options.header_height +
            this.options.padding +
            (this.options.bar_height + this.options.padding) *
                this.tasks.length;

        createSVG('rect', {
            x: 0,
            y: 0,
            width: grid_width,
            height: grid_height,
            class: 'grid-background',
            append_to: this.layers.grid
        });

        $.attr(this.$svg, {
            height: grid_height + this.options.padding + 100,
            width: '100%'
        });
    }

    make_grid_rows() {
        const rows_layer = createSVG('g', { append_to: this.layers.grid });
        const lines_layer = createSVG('g', { append_to: this.layers.grid });

        const row_width = this.dates.length * this.options.column_width;
        const row_height = this.options.bar_height + this.options.padding;

        let row_y = this.options.header_height + this.options.padding / 2;

        for (let task of this.tasks) {
            createSVG('rect', {
                x: 0,
                y: row_y,
                width: row_width,
                height: row_height,
                class: 'grid-row',
                append_to: rows_layer
            });

            createSVG('line', {
                x1: 0,
                y1: row_y + row_height,
                x2: row_width,
                y2: row_y + row_height,
                class: 'row-line',
                append_to: lines_layer
            });

            row_y += this.options.bar_height + this.options.padding;
        }
    }

    make_grid_header() {
        const header_width = this.dates.length * this.options.column_width;
        const header_height = this.options.header_height + 10;
        createSVG('rect', {
            x: 0,
            y: 0,
            width: header_width,
            height: header_height,
            class: 'grid-header',
            append_to: this.options.header_fixed
                ? this.layers.date
                : this.layers.grid
        });
    }

    make_grid_ticks() {
        let tick_x = 0;
        let tick_y = this.options.header_height + this.options.padding / 2;
        let tick_height =
            (this.options.bar_height + this.options.padding) *
            this.tasks.length;

        for (let date of this.dates) {
            let tick_class = 'tick';
            // thick tick for monday
            if (this.view_is('Day') && date.getDate() === 1) {
                tick_class += ' thick';
            }
            // thick tick for first week
            if (
                this.view_is('Week') &&
                date.getDate() >= 1 &&
                date.getDate() < 8
            ) {
                tick_class += ' thick';
            }
            // thick ticks for quarters
            if (this.view_is('Month') && (date.getMonth() + 1) % 3 === 0) {
                tick_class += ' thick';
            }

            createSVG('path', {
                d: `M ${tick_x} ${tick_y} v ${tick_height}`,
                class: tick_class,
                append_to: this.layers.grid
            });

            if (this.view_is('Month')) {
                tick_x +=
                    date_utils.get_days_in_month(date) *
                    this.options.column_width /
                    30;
            } else {
                tick_x += this.options.column_width;
            }
        }
    }

    make_grid_highlights() {
        // highlight today's date
        if (this.view_is('Day')) {
            const x =
                date_utils.diff(date_utils.today(), this.gantt_start, 'hour') /
                this.options.step *
                this.options.column_width;
            const y = 0;

            const width = this.options.column_width;
            const height =
                (this.options.bar_height + this.options.padding) *
                    this.tasks.length +
                this.options.header_height +
                this.options.padding / 2;

            createSVG('rect', {
                x,
                y,
                width,
                height,
                class: 'today-highlight',
                append_to: this.layers.grid
            });
        }
    }

    make_dates() {
        for (let date of this.get_dates_to_draw()) {
            createSVG('text', {
                x: date.lower_x,
                y: date.lower_y,
                innerHTML: date.lower_text,
                class: 'lower-text',
                append_to: this.layers.date
            });

            if (date.upper_text) {
                const $upper_text = createSVG('text', {
                    x: date.upper_x,
                    y: date.upper_y,
                    innerHTML: date.upper_text,
                    class: 'upper-text',
                    append_to: this.layers.date
                });

                // remove out-of-bound dates
                if (
                    $upper_text.getBBox().x2 > this.layers.grid.getBBox().width
                ) {
                    $upper_text.remove();
                }
            }
        }
    }

    get_dates_to_draw() {
        let last_date = null;
        const dates = this.dates.map((date, i) => {
            const d = this.get_date_info(date, last_date, i);
            last_date = date;
            return d;
        });
        return dates;
    }

    get_date_info(date, last_date, i) {
        if (!last_date) {
            last_date = date_utils.add(date, 1, 'year');
        }
        const date_text = {
            Hour_lower: date_utils.format(date, 'HH', this.options.language),
            'Quarter Day_lower': date_utils.format(
                date,
                'HH',
                this.options.language
            ),
            'Half Day_lower': date_utils.format(
                date,
                'HH',
                this.options.language
            ),
            Day_lower:
                date.getDate() !== last_date.getDate()
                    ? date_utils.format(date, 'D', this.options.language)
                    : '',
            Week_lower:
                date.getMonth() !== last_date.getMonth()
                    ? date_utils.format(date, 'D MMM', this.options.language)
                    : date_utils.format(date, 'D', this.options.language),
            Month_lower: date_utils.format(date, 'MMMM', this.options.language),
            Year_lower: date_utils.format(date, 'YYYY', this.options.language),
            Hour_upper:
                date.getDate() !== last_date.getDate()
                    ? date_utils.format(date, 'D MMM', this.options.language)
                    : '',
            'Quarter Day_upper':
                date.getDate() !== last_date.getDate()
                    ? date_utils.format(date, 'D MMM', this.options.language)
                    : '',
            'Half Day_upper':
                date.getDate() !== last_date.getDate()
                    ? date.getMonth() !== last_date.getMonth()
                      ? date_utils.format(date, 'D MMM', this.options.language)
                      : date_utils.format(date, 'D', this.options.language)
                    : '',
            Day_upper:
                date.getMonth() !== last_date.getMonth()
                    ? date_utils.format(date, 'MMMM', this.options.language)
                    : '',
            Week_upper:
                date.getMonth() !== last_date.getMonth()
                    ? date_utils.format(date, 'MMMM', this.options.language)
                    : '',
            Month_upper:
                date.getFullYear() !== last_date.getFullYear()
                    ? date_utils.format(date, 'YYYY', this.options.language)
                    : '',
            Year_upper:
                date.getFullYear() !== last_date.getFullYear()
                    ? date_utils.format(date, 'YYYY', this.options.language)
                    : ''
        };

        const base_pos = {
            x: i * this.options.column_width,
            lower_y: this.options.header_height,
            upper_y: this.options.header_height - 25
        };

        const x_pos = {
            Hour_lower: 0,
            'Quarter Day_upper': 0,
            Hour_upper: this.options.column_width * 24 / 2,
            'Half Day_lower': this.options.column_width * 2 / 2,
            'Quarter Day_lower': 0,
            'Half Day_upper': 0,
            'Quarter Day_upper': this.options.column_width * 4 / 2,
            'Half Day_lower': 0,
            'Half Day_upper': this.options.column_width * 2 / 2,
            Day_lower: this.options.column_width / 2,
            Day_upper: this.options.column_width * 30 / 2,
            Week_lower: 0,
            Week_upper: this.options.column_width * 4 / 2,
            Month_lower: this.options.column_width / 2,
            Month_upper: this.options.column_width * 12 / 2,
            Year_lower: this.options.column_width / 2,
            Year_upper: this.options.column_width * 30 / 2
        };

        return {
            upper_text: date_text[`${this.options.view_mode}_upper`],
            lower_text: date_text[`${this.options.view_mode}_lower`],
            upper_x: base_pos.x + x_pos[`${this.options.view_mode}_upper`],
            upper_y: base_pos.upper_y,
            lower_x: base_pos.x + x_pos[`${this.options.view_mode}_lower`],
            lower_y: base_pos.lower_y
        };
    }

    make_bars() {
        this.bar_map = {};
        this.bars = this.tasks.map(task => {
            if (task.type === 'task') {
                const bar = new Bar(this, task);
                this.layers.bar.appendChild(bar.group);
                this.bar_map[task.id] = bar;
                return bar;
            } else if (task.type === 'milestone') {
                const bar = new Milestone(this, task);
                this.layers.bar.appendChild(bar.group);
                this.bar_map[task.id] = bar;
                return bar;
            }
        });
        //  connector line
        createSVG('line', {
            x1: 0,
            y1: 0,
            id: 'path-link',
            class: 'path-link',
            visibility: 'hidden',
            append_to: this.layers.bar
        });
        const nowMarker = new Marker(this, {
            time: date_utils.now(),
            text: 'Now'
        });
        this.layers.markers.appendChild(nowMarker.group);
        setInterval(() => {
            nowMarker.setMarker({
                time: date_utils.now(),
                text: 'Now'
            });
        }, 1000 * 60);
    }

    make_arrows() {
        this.arrows = [];
        for (let task of this.tasks) {
            let arrows = [];
            arrows = task.dependencies
                .map(task_id => {
                    const dependency = this.get_task(task_id);
                    if (!dependency) return;
                    const arrow = new ArrowRect(
                        this,
                        this.get_bar(dependency.id), // from_task
                        this.get_bar(task.id) // to_task
                    );
                    this.layers.arrow.appendChild(arrow.element);
                    return arrow;
                })
                .filter(Boolean); // filter falsy values
            this.arrows = this.arrows.concat(arrows);
        }
    }
    append_arrow(from_id, to_id) {
        //  update task
        this.task_map[to_id] = new Task(
            this,
            Object.assign({}, this.task_map[to_id], {
                dependencies: this.task_map[to_id].dependencies.concat([
                    from_id
                ])
            })
        );
        // add arrow
        const arrow = new ArrowRect(
            this,
            this.get_bar(from_id), // from_task
            this.get_bar(to_id) // to_task
        );

        //  update bar
        this.get_bar(from_id).arrows = this.get_bar(from_id).arrows.concat([
            arrow
        ]);
        this.get_bar(to_id).arrows = this.get_bar(to_id).arrows.concat([arrow]);

        this.layers.arrow.appendChild(arrow.element);
        this.arrows = this.arrows.concat([arrow]);

        //  send event
        this.trigger_event('dependency_added', [
            {
                from: this.get_task(from_id),
                to: this.get_task(to_id)
            }
        ]);
    }

    map_arrows_on_bars() {
        for (let task_id in this.bar_map) {
            const bar = this.get_bar(task_id);
            bar.arrows = this.arrows.filter(arrow => {
                return (
                    arrow.from_task.task.id === bar.task.id ||
                    arrow.to_task.task.id === bar.task.id
                );
            });
        }
    }

    set_width() {
        const cur_width = this.$svg.getBoundingClientRect().width;
        const actual_width = this.$svg
            .querySelector('.grid .grid-row')
            .getAttribute('width');
        if (cur_width < actual_width) {
            this.$svg.setAttribute('width', actual_width);
        }
    }

    set_scroll_position() {
        const parent_element = this.$svg.parentElement;
        if (!parent_element) return;

        const hours_before_first_task = date_utils.diff(
            this.get_oldest_starting_date(),
            this.gantt_start,
            'hour'
        );

        const scroll_pos =
            hours_before_first_task /
                this.options.step *
                this.options.column_width -
            this.options.column_width;

        parent_element.scrollLeft = scroll_pos;
    }

    bind_grid_click() {
        $.on(
            this.$svg,
            this.options.popup_trigger,
            '.grid-row, .grid-header',
            () => {
                this.unselect_all();
                this.hide_popup();
            }
        );
    }

    bind_bar_events() {
        let is_dragging = false;
        let is_linking = false;
        let x_on_start = 0;
        let x_on_scroll_start = 0;
        let y_on_start = 0;
        let is_resizing_left = false;
        let is_resizing_right = false;
        let parent_bar_id = null;
        let bars = []; // instanceof Bar
        this.bar_being_dragged = null;

        //  linking dependencies
        let is_input_link = false;
        let dependency_from = null;
        let connector_from = null;
        let dependency_from_linking = null;
        let dragElement = null;
        let link_path = document.getElementById('path-link');

        function action_in_progress() {
            return (
                is_dragging ||
                is_resizing_left ||
                is_resizing_right ||
                is_linking
            );
        }

        $.on(
            this.$svg,
            'mousedown',
            '.bar-wrapper, .handle, .handle-link',
            (e, element) => {
                const bar_wrapper = $.closest('.bar-wrapper', element);

                x_on_start = e.offsetX;
                y_on_start = e.offsetY;

                if (element.classList.contains('handle-link')) {
                    is_linking = true;
                    is_input_link = !element.classList.contains('link-output');

                    //  handle-dependency
                    const $link_wrapper = $.closest('.link-connector', element);
                    const link = $link_wrapper.querySelector('.handle-link');
                    const circle = $link_wrapper.querySelector('.circle-link');

                    connector_from = $link_wrapper;
                    dependency_from = circle;
                    dependency_from_linking = link;

                    x_on_start = circle.getAttribute('cx');
                    y_on_start = circle.getAttribute('cy');

                    link_path.setAttribute('x1', x_on_start);
                    link_path.setAttribute('y1', y_on_start);
                    connector_from.classList.add('connector');
                    this.layers.bar.classList.add('in-connection');
                } else {
                    if (element.classList.contains('left')) {
                        is_resizing_left = true;
                    } else if (element.classList.contains('right')) {
                        is_resizing_right = true;
                    } else if (element.classList.contains('bar-wrapper')) {
                        is_dragging = true;
                    }

                    bar_wrapper.classList.add('active');
                    parent_bar_id = bar_wrapper.getAttribute('data-id');
                    const ids = [
                        parent_bar_id,
                        ...this.get_all_dependent_tasks(parent_bar_id)
                    ];
                    bars = ids.map(id => this.get_bar(id));

                    this.bar_being_dragged = parent_bar_id;

                    bars.forEach(bar => {
                        const $bar = bar.$bar;
                        $bar.ox = $bar.getX();
                        $bar.oy = $bar.getY();
                        $bar.owidth = $bar.getWidth();
                        $bar.finaldx = 0;
                    });
                }
            }
        );

        const mouseMoveHandler = e => {
            if (!action_in_progress()) return;
            if (is_linking) {
                const dx = e.offsetX;
                const dy = e.offsetY;
                link_path.setAttribute('x1', x_on_start);
                link_path.setAttribute('y1', y_on_start);
                link_path.setAttribute('x2', dx);
                link_path.setAttribute('y2', dy);
                link_path.setAttribute('visibility', 'visible');

                dependency_from_linking.setAttribute('cx', dx);
                dependency_from_linking.setAttribute('cy', dy);
            } else {
                const dx = e.offsetX - x_on_start;
                const dy = e.offsetY - y_on_start;

                bars.forEach(bar => {
                    const $bar = bar.$bar;
                    $bar.finaldx = this.get_snap_position(dx);

                    if (is_resizing_left) {
                        if (parent_bar_id === bar.task.id) {
                            bar.update_bar_position({
                                x: $bar.ox + $bar.finaldx,
                                width: $bar.owidth - $bar.finaldx
                            });
                        } else {
                            bar.update_bar_position({
                                x: $bar.ox + $bar.finaldx
                            });
                        }
                    } else if (is_resizing_right) {
                        if (parent_bar_id === bar.task.id) {
                            bar.update_bar_position({
                                width: $bar.owidth + $bar.finaldx
                            });
                        }
                    } else if (is_dragging) {
                        bar.update_bar_position({ x: $bar.ox + $bar.finaldx });
                    }
                });
            }
        };
        $.on(this.$svg, 'mousemove', throttle(mouseMoveHandler, 20, this));

        document.addEventListener('mouseup', e => {
            if (is_linking) {
                try {
                    const connector_to = e.target.closest('.bar-wrapper');
                    let from_id = connector_from.getAttribute('task-id');
                    let to_id = connector_to.getAttribute('data-id');
                    if (to_id !== from_id) {
                        this.append_arrow(from_id, to_id);
                    }
                } catch (error) {
                    try {
                        const connector_to = $.closest(
                            '.link-connector',
                            e.target
                        );
                        let from_id = connector_from.getAttribute('task-id');
                        let to_id = connector_to.getAttribute('task-id');
                        if (to_id !== from_id) {
                            this.append_arrow(from_id, to_id);
                        }
                    } catch (error) {}
                }

                connector_from.classList.remove('connector');
                this.layers.bar.setAttribute('class', 'bar');
                const cx = dependency_from.getAttribute('cx');
                const cy = dependency_from.getAttribute('cy');
                dependency_from_linking.setAttribute('cx', cx);
                dependency_from_linking.setAttribute('cy', cy);
                link_path.setAttribute('visibility', 'hidden');
                this.layers.bar.classList.remove('in-connection');
            } else if (is_dragging || is_resizing_left || is_resizing_right) {
                bars.forEach(bar => bar.group.classList.remove('active'));
            }
            is_linking = false;
            is_dragging = false;
            is_resizing_left = false;
            is_resizing_right = false;
        });

        if (this.options.header_fixed) {
            $.on(this.$container, 'scroll', e => {
                this.layers.date.setAttribute(
                    'transform',
                    'translate(0,' + e.currentTarget.scrollTop + ')'
                );
                x_on_scroll_start = e.currentTarget.scrollLeft;
            });
        }

        $.on(this.$svg, 'mouseup', e => {
            this.bar_being_dragged = null;
            bars.forEach(bar => {
                const $bar = bar.$bar;
                if (!$bar.finaldx) return;
                bar.date_changed();
                bar.set_action_completed();
            });
        });

        this.bind_bar_progress();
    }

    bind_bar_progress() {
        let x_on_start = 0;
        let y_on_start = 0;
        let is_resizing = null;
        let bar = null;
        let $bar_progress = null;
        let $bar = null;

        $.on(this.$svg, 'mousedown', '.handle.progress', (e, handle) => {
            is_resizing = true;
            x_on_start = e.offsetX;
            y_on_start = e.offsetY;

            const $bar_wrapper = $.closest('.bar-wrapper', handle);
            const id = $bar_wrapper.getAttribute('data-id');
            bar = this.get_bar(id);

            $bar_progress = bar.$bar_progress;
            $bar = bar.$bar;

            $bar_progress.finaldx = 0;
            $bar_progress.owidth = $bar_progress.getWidth();
            $bar_progress.min_dx = -$bar_progress.getWidth();
            $bar_progress.max_dx = $bar.getWidth() - $bar_progress.getWidth();
        });

        const progressMouseMoveHandler = e => {
            if (!is_resizing) return;
            let dx = e.offsetX - x_on_start;
            let dy = e.offsetY - y_on_start;

            if (dx > $bar_progress.max_dx) {
                dx = $bar_progress.max_dx;
            }
            if (dx < $bar_progress.min_dx) {
                dx = $bar_progress.min_dx;
            }

            const $handle = bar.$handle_progress;
            $.attr($bar_progress, 'width', $bar_progress.owidth + dx);
            $.attr($handle, 'points', bar.get_progress_polygon_points());
            $bar_progress.finaldx = dx;
        };
        $.on(
            this.$svg,
            'mousemove',
            throttle(progressMouseMoveHandler, 50, this)
        );

        $.on(this.$svg, 'mouseup', e => {
            is_resizing = false;

            if (!($bar_progress && $bar_progress.finaldx)) return;
            bar.progress_changed();
            bar.set_action_completed();
        });
    }

    get_all_dependent_tasks(task_id) {
        let out = [];
        let to_process = [task_id];
        while (to_process.length) {
            const deps = to_process.reduce((acc, curr) => {
                acc = acc.concat(this.dependency_map[curr]);
                return acc;
            }, []);

            out = out.concat(deps);
            to_process = deps.filter(d => !to_process.includes(d));
        }

        return out.filter(Boolean);
    }

    get_snap_position(dx) {
        let odx = dx,
            rem,
            position;

        if (this.view_is('Week')) {
            rem = dx % (this.options.column_width / 7);
            position =
                odx -
                rem +
                (rem < this.options.column_width / 14
                    ? 0
                    : this.options.column_width / 7);
        } else if (this.view_is('Month')) {
            rem = dx % (this.options.column_width / 30);
            position =
                odx -
                rem +
                (rem < this.options.column_width / 60
                    ? 0
                    : this.options.column_width / 30);
        } else {
            rem = dx % this.options.column_width;
            position =
                odx -
                rem +
                (rem < this.options.column_width / 2
                    ? 0
                    : this.options.column_width);
        }
        return position;
    }

    unselect_all() {
        [...this.$svg.querySelectorAll('.bar-wrapper')].forEach(el => {
            el.classList.remove('active');
        });
    }

    view_is(modes) {
        if (typeof modes === 'string') {
            return this.options.view_mode === modes;
        }

        if (Array.isArray(modes)) {
            return modes.some(mode => this.options.view_mode === mode);
        }

        return false;
    }

    get_task(id) {
        return this.task_map[id];
    }

    get_bar(id) {
        return this.bar_map[id];
    }

    show_popup(options) {
        if (!this.popup) {
            this.popup = new Popup(
                this.popup_wrapper,
                this.options.custom_popup_html
            );
        }
        this.popup.show(options);
    }

    hide_popup() {
        this.popup && this.popup.hide();
    }

    trigger_event(event, args) {
        if (this.options['on_' + event]) {
            this.options['on_' + event].apply(null, args);
        }
    }

    /**
     * Gets the oldest starting date from the list of tasks
     *
     * @returns Date
     * @memberof Gantt
     */
    get_oldest_starting_date() {
        return this.tasks
            .map(task => task._start)
            .reduce(
                (prev_date, cur_date) =>
                    cur_date <= prev_date ? cur_date : prev_date
            );
    }

    /**
     * draggable get Overlap Area
     * @param {*} element1
     * @param {*} element2
     */
    hit_test(element1, element2) {
        var rect1 = element1.getBoundingClientRect();
        var rect2 = element2.getBoundingClientRect();

        console.log('rect1', rect1);
        console.log('rect2', rect2);

        var xOverlap = Math.max(
            0,
            Math.min(rect1.right, rect2.right) -
                Math.max(rect1.left, rect2.left)
        );
        var yOverlap = Math.max(
            0,
            Math.min(rect1.bottom, rect2.bottom) -
                Math.max(rect1.top, rect2.top)
        );
        // console.log('xOverlap', xOverlap, ' yOverlap', yOverlap);
        // return xOverlap * yOverlap;
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    /**
     * Clear all elements from the parent svg element
     *
     * @memberof Gantt
     */
    clear() {
        this.$svg.innerHTML = '';
        if (this.draggable) {
            this.draggable.kill();
        }
    }
}

function generate_id(task) {
    return (
        task.name +
        '_' +
        Math.random()
            .toString(36)
            .slice(2, 12)
    );
}
