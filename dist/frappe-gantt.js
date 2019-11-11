var Gantt = (function () {
'use strict';

const YEAR = 'year';
const MONTH = 'month';
const DAY = 'day';
const HOUR = 'hour';
const MINUTE = 'minute';
const SECOND = 'second';
const MILLISECOND = 'millisecond';

const month_names = {
    en: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ],
    es: [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre'
    ],
    ru: [
        'Январь',
        'Февраль',
        'Март',
        'Апрель',
        'Май',
        'Июнь',
        'Июль',
        'Август',
        'Сентябрь',
        'Октябрь',
        'Ноябрь',
        'Декабрь'
    ],
    ptBr: [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro'
    ],
    fr: [
        'Janvier',
        'Février',
        'Mars',
        'Avril',
        'Mai',
        'Juin',
        'Juillet',
        'Août',
        'Septembre',
        'Octobre',
        'Novembre',
        'Décembre'
    ]
};

var date_utils = {
    parse(date, date_separator = '-', time_separator = /[.:]/) {
        if (date instanceof Date) {
            return date;
        }
        if (typeof date === 'string') {
            let date_parts, time_parts;
            const parts = date.split(' ');

            date_parts = parts[0]
                .split(date_separator)
                .map(val => parseInt(val, 10));
            time_parts = parts[1] && parts[1].split(time_separator);

            // month is 0 indexed
            date_parts[1] = date_parts[1] - 1;

            let vals = date_parts;

            if (time_parts && time_parts.length) {
                if (time_parts.length == 4) {
                    time_parts[3] = '0.' + time_parts[3];
                    time_parts[3] = parseFloat(time_parts[3]) * 1000;
                }
                vals = vals.concat(time_parts);
            }

            return new Date(...vals);
        }
    },

    to_string(date, with_time = false) {
        if (!(date instanceof Date)) {
            throw new TypeError('Invalid argument type');
        }
        const vals = this.get_date_values(date).map((val, i) => {
            if (i === 1) {
                // add 1 for month
                val = val + 1;
            }

            if (i === 6) {
                return padStart(val + '', 3, '0');
            }

            return padStart(val + '', 2, '0');
        });
        const date_string = `${vals[0]}-${vals[1]}-${vals[2]}`;
        const time_string = `${vals[3]}:${vals[4]}:${vals[5]}.${vals[6]}`;

        return date_string + (with_time ? ' ' + time_string : '');
    },

    format(date, format_string = 'YYYY-MM-DD HH:mm:ss.SSS', lang = 'en') {
        const values = this.get_date_values(date).map(d => padStart(d, 2, 0));
        const format_map = {
            YYYY: values[0],
            MM: padStart(+values[1] + 1, 2, 0),
            DD: values[2],
            HH: values[3],
            mm: values[4],
            ss: values[5],
            SSS:values[6],
            D: values[2],
            MMMM: month_names[lang][+values[1]],
            MMM: month_names[lang][+values[1]]
        };

        let str = format_string;
        const formatted_values = [];

        Object.keys(format_map)
            .sort((a, b) => b.length - a.length) // big string first
            .forEach(key => {
                if (str.includes(key)) {
                    str = str.replace(key, `$${formatted_values.length}`);
                    formatted_values.push(format_map[key]);
                }
            });

        formatted_values.forEach((value, i) => {
            str = str.replace(`$${i}`, value);
        });

        return str;
    },

    diff(date_a, date_b, scale = DAY) {
        let milliseconds, seconds, hours, minutes, days, months, years;

        milliseconds = date_a - date_b;
        seconds = milliseconds / 1000;
        minutes = seconds / 60;
        hours = minutes / 60;
        days = hours / 24;
        months = days / 30;
        years = months / 12;

        if (!scale.endsWith('s')) {
            scale += 's';
        }

        return Math.floor(
            {
                milliseconds,
                seconds,
                minutes,
                hours,
                days,
                months,
                years
            }[scale]
        );
    },

    today() {
        const vals = this.get_date_values(new Date()).slice(0, 3);
        return new Date(...vals);
    },

    now() {
        return new Date();
    },

    add(date, qty, scale) {
        qty = parseInt(qty, 10);
        const vals = [
            date.getFullYear() + (scale === YEAR ? qty : 0),
            date.getMonth() + (scale === MONTH ? qty : 0),
            date.getDate() + (scale === DAY ? qty : 0),
            date.getHours() + (scale === HOUR ? qty : 0),
            date.getMinutes() + (scale === MINUTE ? qty : 0),
            date.getSeconds() + (scale === SECOND ? qty : 0),
            date.getMilliseconds() + (scale === MILLISECOND ? qty : 0)
        ];
        return new Date(...vals);
    },

    start_of(date, scale) {
        const scores = {
            [YEAR]: 6,
            [MONTH]: 5,
            [DAY]: 4,
            [HOUR]: 3,
            [MINUTE]: 2,
            [SECOND]: 1,
            [MILLISECOND]: 0
        };

        function should_reset(_scale) {
            const max_score = scores[scale];
            return scores[_scale] <= max_score;
        }

        const vals = [
            date.getFullYear(),
            should_reset(YEAR) ? 0 : date.getMonth(),
            should_reset(MONTH) ? 1 : date.getDate(),
            should_reset(DAY) ? 0 : date.getHours(),
            should_reset(HOUR) ? 0 : date.getMinutes(),
            should_reset(MINUTE) ? 0 : date.getSeconds(),
            should_reset(SECOND) ? 0 : date.getMilliseconds()
        ];

        return new Date(...vals);
    },

    clone(date) {
        return new Date(...this.get_date_values(date));
    },

    get_date_values(date) {
        return [
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds(),
            date.getMilliseconds()
        ];
    },

    get_days_in_month(date) {
        const no_of_days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        const month = date.getMonth();

        if (month !== 1) {
            return no_of_days[month];
        }

        // Feb
        const year = date.getFullYear();
        if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) {
            return 29;
        }
        return 28;
    }
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
function padStart(str, targetLength, padString) {
    str = str + '';
    targetLength = targetLength >> 0;
    padString = String(typeof padString !== 'undefined' ? padString : ' ');
    if (str.length > targetLength) {
        return String(str);
    } else {
        targetLength = targetLength - str.length;
        if (targetLength > padString.length) {
            padString += padString.repeat(targetLength / padString.length);
        }
        return padString.slice(0, targetLength) + String(str);
    }
}

function $(expr, con) {
    return typeof expr === 'string'
        ? (con || document).querySelector(expr)
        : expr || null;
}

function createSVG(tag, attrs) {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (let attr in attrs) {
        if (attr === 'append_to') {
            const parent = attrs.append_to;
            parent.appendChild(elem);
        } else if (attr === 'innerHTML') {
            elem.innerHTML = attrs.innerHTML;
        } else {
            elem.setAttribute(attr, attrs[attr]);
        }
    }
    return elem;
}

function animateSVG(svgElement, attr, from, to) {
    const animatedSvgElement = getAnimationElement(svgElement, attr, from, to);

    if (animatedSvgElement === svgElement) {
        // triggered 2nd time programmatically
        // trigger artificial click event
        const event = document.createEvent('HTMLEvents');
        event.initEvent('click', true, true);
        event.eventName = 'click';
        animatedSvgElement.dispatchEvent(event);
    }
}

function getAnimationElement(
    svgElement,
    attr,
    from,
    to,
    dur = '0.4s',
    begin = '0.1s'
) {
    const animEl = svgElement.querySelector('animate');
    if (animEl) {
        $.attr(animEl, {
            attributeName: attr,
            from,
            to,
            dur,
            begin: 'click + ' + begin // artificial click
        });
        return svgElement;
    }

    const animateElement = createSVG('animate', {
        attributeName: attr,
        from,
        to,
        dur,
        begin,
        calcMode: 'spline',
        values: from + ';' + to,
        keyTimes: '0; 1',
        keySplines: cubic_bezier('ease-out')
    });
    svgElement.appendChild(animateElement);

    return svgElement;
}

function cubic_bezier(name) {
    return {
        ease: '.25 .1 .25 1',
        linear: '0 0 1 1',
        'ease-in': '.42 0 1 1',
        'ease-out': '0 0 .58 1',
        'ease-in-out': '.42 0 .58 1'
    }[name];
}

$.on = (element, event, selector, callback) => {
    if (!callback) {
        callback = selector;
        $.bind(element, event, callback);
    } else {
        $.delegate(element, event, selector, callback);
    }
};

$.off = (element, event, handler) => {
    element.removeEventListener(event, handler);
};

$.bind = (element, event, callback) => {
    event.split(/\s+/).forEach(function(event) {
        element.addEventListener(event, callback);
    });
};

$.delegate = (element, event, selector, callback) => {
    element.addEventListener(event, function(e) {
        const delegatedTarget = e.target.closest(selector);
        if (delegatedTarget) {
            e.delegatedTarget = delegatedTarget;
            callback.call(this, e, delegatedTarget);
        }
    });
};

$.closest = (selector, element) => {
    if (!element) return null;

    if (element.matches(selector)) {
        return element;
    }

    return $.closest(selector, element.parentNode);
};

$.attr = (element, attr, value) => {
    if (!value && typeof attr === 'string') {
        return element.getAttribute(attr);
    }

    if (typeof attr === 'object') {
        for (let key in attr) {
            $.attr(element, key, attr[key]);
        }
        return;
    }

    element.setAttribute(attr, value);
};

class Bar {
    constructor(gantt, task) {
        this.set_defaults(gantt, task);
        this.prepare();
        this.draw();
        this.bind();
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

    prepare_values() {
        this.invalid = this.task.invalid;
        this.height = this.gantt.options.bar_height;

        this.image_size = this.gantt.options.bar_height - 5;
        this.x = this.compute_x();
        this.y = this.compute_y();
        this.corner_radius = this.gantt.options.bar_corner_radius;
        this.duration =
            date_utils.diff(
                this.task._end_date,
                this.task._start_date,
                'hour'
            ) / this.gantt.options.step;
        this.width = this.gantt.options.column_width * this.duration;
        this.progress_width =
            this.gantt.options.column_width *
                this.duration *
                (this.task.progress / 100) || 0;
        this.group = createSVG('g', {
            class:
                'bar-wrapper ' +
                (this.task._group ? `${this.task._group.bar_class} ` : '') +
                (this.task.custom_class || ''),
            'data-group-id': this.task.group_id,
            'data-id': this.task.id
        });
        this.bar_group = createSVG('g', {
            class: 'bar-group',
            append_to: this.group
        });
        this.handle_group = createSVG('g', {
            class: 'handle-group',
            append_to: this.group
        });
        this.link_group = createSVG('g', {
            class: 'link-group',
            append_to: this.group
        });
    }

    prepare_helpers() {
        SVGElement.prototype.getX = function() {
            return +this.getAttribute('x');
        };
        SVGElement.prototype.getY = function() {
            return +this.getAttribute('y');
        };
        SVGElement.prototype.getWidth = function() {
            return +this.getAttribute('width');
        };
        SVGElement.prototype.getHeight = function() {
            return +this.getAttribute('height');
        };
        SVGElement.prototype.getEndX = function() {
            return this.getX() + this.getWidth();
        };
    }

    draw() {
        this.draw_bar();
        this.draw_progress_bar();
        this.draw_label();
        this.draw_resize_handles();
        this.draw_connector();
        if (this.task.thumbnail) {
            this.draw_thumbnail();
        }
    }
    draw_connector() {
        const bar = this.$bar;
        const link_in = createSVG('g', {
            class: 'link-connector link-in',
            'task-id': this.task.id,
            append_to: this.link_group
        });
        const link_out = createSVG('g', {
            class: 'link-connector link-out',
            'task-id': this.task.id,
            append_to: this.link_group
        });
        createSVG('circle', {
            cx: bar.getX() - this.gantt.options.padding / 2,
            cy: this.y + this.gantt.options.bar_height / 2,
            r: 6,
            class: 'circle-link',
            append_to: link_in
        });
        createSVG('circle', {
            cx: bar.getX() - this.gantt.options.padding / 2,
            cy: this.y + this.gantt.options.bar_height / 2,
            r: 6,
            class: 'handle-link link-input',
            append_to: link_in,
            task_id: this.task.id
        });

        createSVG('circle', {
            cx: bar.getX() + bar.getWidth() + this.gantt.options.padding / 2,
            cy: this.y + this.gantt.options.bar_height / 2,
            r: 6,
            class: 'circle-link',
            append_to: link_out
        });
        createSVG('circle', {
            cx: bar.getX() + bar.getWidth() + this.gantt.options.padding / 2,
            cy: this.y + this.gantt.options.bar_height / 2,
            r: 6,
            class: 'handle-link link-output',
            append_to: link_out,
            task_id: this.task.id
        });
    }

    draw_bar() {
        this.$bar = createSVG('rect', {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            rx: this.corner_radius,
            ry: this.corner_radius,
            class: 'bar',
            append_to: this.bar_group
        });

        animateSVG(this.$bar, 'width', 0, this.width);

        if (this.invalid) {
            this.$bar.classList.add('bar-invalid');
        }
    }
    draw_progress_bar() {
        if (this.invalid) return;
        this.$bar_progress = createSVG('rect', {
            x: this.x,
            y: this.y,
            width: this.progress_width,
            height: this.height,
            rx: this.corner_radius,
            ry: this.corner_radius,
            class: 'bar-progress',
            append_to: this.bar_group
        });

        animateSVG(this.$bar_progress, 'width', 0, this.progress_width);
    }

    draw_label() {
        let x_coord;
        if (this.task.img) {
            // x_coord = this.x + this.image_size + padding;
            x_coord = this.x + this.width / 2;
        } else {
            x_coord = this.x + 5;
        }
        createSVG('text', {
            x: x_coord,
            y: this.y + this.height / 2,
            innerHTML: this.task.name,
            class: 'bar-label',
            append_to: this.bar_group
        });
        // labels get BBox in the next tick
        requestAnimationFrame(() => this.update_label_position());
    }
    draw_thumbnail() {
        let x_offset = 10,
            y_offset = 2;
        let defs, clipPath;

        defs = createSVG('defs', {
            append_to: this.bar_group
        });

        createSVG('rect', {
            id: 'rect_' + this.task.id,
            x: this.x + x_offset,
            y: this.y + y_offset,
            width: this.image_size,
            height: this.image_size,
            rx: '15',
            class: 'img_mask',
            append_to: defs
        });

        clipPath = createSVG('clipPath', {
            id: 'clip_' + this.task.id,
            append_to: defs
        });

        createSVG('use', {
            href: '#rect_' + this.task.id,
            append_to: clipPath
        });

        createSVG('image', {
            x: this.x + x_offset,
            y: this.y + y_offset,
            width: this.image_size,
            height: this.image_size,
            class: 'bar-img',
            href: this.task.thumbnail,
            clipPath: 'clip_' + this.task.id,
            append_to: this.bar_group
        });
    }
    draw_resize_handles() {
        if (this.invalid) return;

        const bar = this.$bar;
        const handle_width = 8;

        createSVG('rect', {
            x: bar.getX() + bar.getWidth() - 9,
            y: bar.getY() + 1,
            width: handle_width,
            height: this.height - 2,
            rx: this.corner_radius,
            ry: this.corner_radius,
            class: 'handle right',
            append_to: this.handle_group
        });

        createSVG('rect', {
            x: bar.getX() + 1,
            y: bar.getY() + 1,
            width: handle_width,
            height: this.height - 2,
            rx: this.corner_radius,
            ry: this.corner_radius,
            class: 'handle left',
            append_to: this.handle_group
        });

        if (this.task.progress && this.task.progress < 100) {
            this.$handle_progress = createSVG('polygon', {
                points: this.get_progress_polygon_points().join(','),
                class: 'handle progress',
                append_to: this.handle_group
            });
        }
    }

    get_progress_polygon_points() {
        const bar_progress = this.$bar_progress;
        return [
            bar_progress.getEndX() - 5,
            bar_progress.getY() + bar_progress.getHeight(),
            bar_progress.getEndX() + 5,
            bar_progress.getY() + bar_progress.getHeight(),
            bar_progress.getEndX(),
            bar_progress.getY() + bar_progress.getHeight() - 8.66
        ];
    }

    bind() {
        if (this.invalid) return;
        this.setup_click_event();
    }

    on_click_event(e) {
        if (this.action_completed) {
            // just finished a move action, wait for a few seconds
            return;
        }

        if (e.type === 'click') {
            this.gantt.trigger_event('click', [this.task]);
        }

        this.gantt.unselect_all();
        this.group.classList.toggle('active');
        this.show_popup();
    }
    on_context_menu(e) {
        e.preventDefault();
        this.gantt.trigger_event('contextmenu', [e, 'bar', [this.task], this]);
    }
    setup_click_event() {
        $.on(this.group, 'focus', this.on_click_event.bind(this));
        $.on(
            this.group,
            this.gantt.options.popup_trigger,
            this.on_click_event.bind(this)
        );
        $.on(this.bar_group, 'contextmenu', this.on_context_menu.bind(this));
    }
    stop_click_event() {
        $.off(this.group, 'focus', this.on_click_event.bind(this));
        $.off(
            this.group,
            this.gantt.options.popup_trigger,
            this.on_click_event.bind(this)
        );
        $.off(this.bar_group, 'contextmenu', this.on_context_menu.bind(this));
    }

    show_popup() {
        if (this.gantt.bar_being_dragged) return;

        const start_date = date_utils.format(
            this.task._start_date,
            'MMM D',
            this.gantt.options.language
        );
        const end_date = date_utils.format(
            date_utils.add(this.task._end_date, -1, 'second'),
            'MMM D',
            this.gantt.options.language
        );
        const subtitle = start_date + ' - ' + end_date;

        this.gantt.show_popup({
            target_element: this.$bar,
            title:
                `<b>${this.task.name}</b>` +
                (this.task._group ? `<br>${this.task._group.name}` : ''),
            subtitle: subtitle,
            task: this.task
        });
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
        this.update_label_position();
        this.update_handle_position();
        this.update_progressbar_position();
        this.update_arrow_position();
        this.update_connector_position();
    }

    date_changed() {
        let changed = false;
        const { new_start_date, new_end_date } = this.compute_start_end_date();

        if (Number(this.task._start_date) !== Number(new_start_date)) {
            changed = true;
            this.task._start_date = new_start_date;
        }

        if (Number(this.task._end_date) !== Number(new_end_date)) {
            changed = true;
            this.task._end_date = new_end_date;
        }

        if (!changed) return;

        this.gantt.trigger_event('date_change', [
            this.task,
            new_start_date,
            date_utils.add(new_end_date, -1, 'second')
        ]);
    }

    progress_changed() {
        const new_progress = this.compute_progress();
        this.task.progress = new_progress;
        this.gantt.trigger_event('progress_change', [this.task, new_progress]);
    }

    set_action_completed() {
        this.action_completed = true;
        setTimeout(() => (this.action_completed = false), 1000);
    }

    compute_start_end_date() {
        const bar = this.$bar;
        const x_in_units = bar.getX() / this.gantt.options.column_width;
        const new_start_date = date_utils.add(
            this.gantt.gantt_start,
            x_in_units * this.gantt.options.step,
            'hour'
        );
        const width_in_units = bar.getWidth() / this.gantt.options.column_width;
        const new_end_date = date_utils.add(
            new_start_date,
            width_in_units * this.gantt.options.step,
            'hour'
        );

        return { new_start_date, new_end_date };
    }

    compute_progress() {
        const progress =
            this.$bar_progress.getWidth() / this.$bar.getWidth() * 100;
        return parseInt(progress, 10);
    }

    compute_x() {
        const { step, column_width } = this.gantt.options;
        const task_start = this.task._start_date;
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

    get_snap_position(dx) {
        let odx = dx,
            rem,
            position;

        if (this.gantt.view_is('Week')) {
            rem = dx % (this.gantt.options.column_width / 7);
            position =
                odx -
                rem +
                (rem < this.gantt.options.column_width / 14
                    ? 0
                    : this.gantt.options.column_width / 7);
        } else if (this.gantt.view_is('Month')) {
            rem = dx % (this.gantt.options.column_width / 30);
            position =
                odx -
                rem +
                (rem < this.gantt.options.column_width / 60
                    ? 0
                    : this.gantt.options.column_width / 30);
        } else {
            rem = dx % this.gantt.options.column_width;
            position =
                odx -
                rem +
                (rem < this.gantt.options.column_width / 2
                    ? 0
                    : this.gantt.options.column_width);
        }
        return position;
    }

    update_attr(element, attr, value) {
        value = +value;
        if (!isNaN(value)) {
            element.setAttribute(attr, value);
        }
        return element;
    }

    update_connector_position() {
        const bar = this.$bar;
        try {
            this.link_group
                .querySelector('.link-in .circle-link')
                .setAttribute(
                    'cx',
                    bar.getX() - this.gantt.options.padding / 2
                );
            this.link_group
                .querySelector('.link-in .handle-link')
                .setAttribute(
                    'cx',
                    bar.getX() - this.gantt.options.padding / 2
                );
            this.link_group
                .querySelector('.link-out .circle-link')
                .setAttribute(
                    'cx',
                    bar.getX() + bar.getWidth() + this.gantt.options.padding / 2
                );
            this.link_group
                .querySelector('.link-out .handle-link')
                .setAttribute(
                    'cx',
                    bar.getX() + bar.getWidth() + this.gantt.options.padding / 2
                );
        } catch (error) {}
    }
    update_progressbar_position() {
        this.$bar_progress.setAttribute('x', this.$bar.getX());
        this.$bar_progress.setAttribute(
            'width',
            this.$bar.getWidth() * (this.task.progress / 100)
        );
    }

    update_label_position() {
        const img_mask = this.bar_group.querySelector('.img_mask') || '';
        const bar = this.$bar,
            label = this.group.querySelector('.bar-label'),
            img = this.group.querySelector('.bar-img');

        let padding = 5;
        let x_offset_label_img = this.image_size + 5;

        if (label.getBBox().width > bar.getWidth()) {
            label.classList.add('big');
            if (img) {
                img.setAttribute(
                    'x',
                    bar.getX() + bar.getWidth() + x_offset_label_img
                );
                img_mask.setAttribute(
                    'x',
                    bar.getX() + bar.getWidth() + x_offset_label_img
                );
                label.setAttribute(
                    'x',
                    bar.getX() +
                        bar.getWidth() +
                        x_offset_label_img +
                        5 +
                        7.5 * 2
                );
            } else {
                label.setAttribute(
                    'x',
                    bar.getX() + bar.getWidth() + 5 + 7.5 * 2
                );
            }
        } else {
            label.classList.remove('big');
            if (img) {
                img.setAttribute(
                    'x',
                    bar.getX() - padding + x_offset_label_img
                );
                img_mask.setAttribute(
                    'x',
                    bar.getX() - padding + x_offset_label_img
                );
                label.setAttribute(
                    'x',
                    bar.getX() + bar.getWidth() / 2 + x_offset_label_img
                );
            } else {
                label.setAttribute('x', bar.getX() + bar.getWidth() / 2);
            }
        }
    }

    update_handle_position() {
        const bar = this.$bar;
        this.handle_group
            .querySelector('.handle.left')
            .setAttribute('x', bar.getX() + 1);
        this.handle_group
            .querySelector('.handle.right')
            .setAttribute('x', bar.getEndX() - 9);
        const handle = this.group.querySelector('.handle.progress');
        handle &&
            handle.setAttribute('points', this.get_progress_polygon_points());
    }

    update_arrow_position() {
        this.arrows = this.arrows || [];
        for (let arrow of this.arrows) {
            arrow.update();
        }
    }
}

class BarPlanned extends Bar {
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

class Arrow {
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

class ArrowRect extends Arrow {
    calculate_path() {
        const circle_radius = 6;
        const circle_separator = 8;
        //  --
        const connector_horizontal = this.gantt.options.padding / 2;
        // |
        const connector_vertical =
            this.gantt.options.bar_height / 2 + this.gantt.options.padding / 2;

        //  check if connector is top to bottom
        //  --
        //  |
        //  ---->
        const is_top_to_bottom = () =>
            this.from_task.y < this.to_task.$bar.getY();

        //  start position x
        let start_x =
            this.from_task.$bar.getX() + this.from_task.$bar.getWidth();
        //  start position y
        let start_y = this.from_task.y + this.gantt.options.bar_height / 2;
        //  end position x
        let end_x = this.to_task.$bar.getX() - this.gantt.options.padding / 2;
        //  end position y
        let end_y =
            this.gantt.options.header_height +
            this.gantt.options.bar_height / 2 +
            (this.gantt.options.padding + this.gantt.options.bar_height) *
                this.to_task.task._index +
            this.gantt.options.padding -
            connector_vertical;

        /**
         *  │
         *  check if:
         *
         *      -   bottom to top:
         *          end from bar A position X is minor than to bar B position X
         *              -   To right diagram:
         *                                ┌──►[///BAR2///]
         *                  [///BAR1///]■─┘
         *              -   To left diagram
         *                       ┌──►[///BAR2///]
         *                       └────────┐
         *                  [///BAR1///]■─┘
         *      -   top to bottom:
         *              -   To right diagram
         *                  [///BAR1///]■─┐
         *                                └──►[///BAR2///]
         *              -   To left diagram
         *                  [///BAR1///]■─┐
         *                       ┌────────┘
         *                       └──►[///BAR2///]
         *
         */

        const condition = () => {
            //  bottom to top condition
            if (!is_top_to_bottom()) {
                if (
                    start_x + connector_horizontal >
                    this.to_task.$bar.getX() -
                        this.gantt.options.padding / 2 +
                        circle_radius +
                        circle_separator
                ) {
                    //  TO RIGHT
                    return false;
                } else {
                    //  TO LEFT
                    return true;
                }
            }
            return (
                // this.to_task.$bar.getX() < start_x + connector_horizontal &&
                start_x >= this.to_task.$bar.getX()
            );
        };

        if (is_top_to_bottom()) {
            this.path = `M ${start_x} ${start_y} 
                l ${connector_horizontal},0 
                l 0,${connector_vertical}
                L ${end_x - connector_horizontal},${end_y}
                l 0,${connector_vertical}
                l 15,0
                m -5 -5
                l 5 5
                l -5 5`;
        } else {
            end_x =
                this.to_task.$bar.getX() -
                connector_horizontal * 2 +
                this.to_task.$bar.getWidth();

            this.path = `M ${start_x} ${start_y}
                l ${connector_horizontal},0
                l 0,-${connector_vertical}
                L ${end_x},${start_y - connector_vertical}
                l 0,-${connector_vertical}
                l 15,0
                m -5 -5
                l 5 5
                l -5 5`;
        }

        const heightBar =
            this.gantt.options.bar_height + this.gantt.options.padding;
        const heightCurrentBar = Math.abs(
            this.from_task.$bar.getY() - this.to_task.$bar.getY()
        );
        if (is_top_to_bottom()) {
            if (heightCurrentBar > heightBar) {
                /**
                 *              -   To right diagram
                 *                  [///BAR1///]■─┐
                 *                                │
                 *                                │
                 *                                └──►[///BAR2///]
                 */
                this.path = `M ${start_x} ${start_y}
                L ${start_x + connector_horizontal},${start_y}
                L ${start_x + connector_horizontal},${end_y +
                    connector_vertical}
                
                L ${end_x - connector_horizontal},${end_y + connector_vertical}
                l ${connector_horizontal},0
                l ${circle_radius / 2},0
                        m -5 -5
                        l 5 5
                        l -5 5`;

                if (condition()) {
                    /**
                     *                  [///BAR1///]■─┐
                     *                                │
                     *                                │
                     *                       ┌────────┘
                     *                       │
                     *                       │
                     *                       └──►[///BAR2///]
                     */
                    this.path = `M ${start_x} ${start_y}
                L ${start_x + connector_horizontal},${start_y}
                L ${start_x + connector_horizontal},${end_y +
                        connector_vertical -
                        heightCurrentBar / 2}
                L ${end_x - connector_horizontal}, ${end_y +
                        connector_vertical -
                        heightCurrentBar / 2}
                L ${end_x - connector_horizontal},${end_y + connector_vertical}
                l ${connector_horizontal},0
                l ${circle_radius / 2},0
                        m -5 -5
                        l 5 5
                        l -5 5`;
                }
            } else {
                if (!condition()) {
                    /**
                     *              -   To left diagram
                     *                  [///BAR1///]■─┐
                     *                       ┌────────┘
                     *                       └──►[///BAR2///]
                     */
                    end_y =
                        start_y +
                        this.gantt.options.bar_height +
                        this.gantt.options.padding;
                    this.path = `M ${start_x} ${start_y}
                    l ${connector_horizontal},0
                    l 0,${this.gantt.options.bar_height +
                        this.gantt.options.padding}
                    L ${end_x},${end_y}
                    m -5 -5
                    l 5 5
                    l -5 5`;
                }
            }
        } else if (!is_top_to_bottom()) {
            if (heightCurrentBar > heightBar) {
                end_x =
                    this.gantt.options.padding / 2 +
                    start_x +
                    this.from_task.$bar.getWidth() -
                    (connector_horizontal +
                        this.to_task.$bar.getWidth() / 2 +
                        this.gantt.options.padding);

                /**
                 *              -   To right diagram:
                 *
                 *                                ┌──►[///BAR2///]
                 *                  [///BAR1///]■─┘
                 */

                const mid =
                    (this.to_task.$bar.getX() -
                        connector_horizontal -
                        (this.from_task.$bar.getX() +
                            connector_horizontal +
                            this.from_task.$bar.getWidth())) /
                    2;
                this.path = `M ${start_x} ${start_y}
                            L ${start_x + connector_horizontal + mid},${start_y}
                            L ${start_x + connector_horizontal + mid},${end_y +
                    connector_vertical}
                            L ${this.to_task.$bar.getX() -
                                circle_radius / 2},${end_y + connector_vertical}
                            m -5 -5
                            l 5 5
                            l -5 5`;

                if (!condition()) {
                    /**
                     *
                     *      Multi jump row
                     *              -   To left diagram
                     *                       ┌──►[///BAR2///]
                     *                       │
                     *                       │
                     *                       └────────┐
                     *                  [///BAR1///]■─┘
                     */
                    end_x =
                        this.from_task.$bar.getX() -
                        connector_horizontal * 2 +
                        this.from_task.$bar.getWidth();
                    this.path = `M ${start_x} ${start_y}
                                l ${connector_horizontal},0
                                l 0, -${connector_vertical}
                                L ${this.to_task.$bar.getX() -
                                    this.gantt.options.padding / 2 -
                                    connector_horizontal},${start_y -
                        connector_vertical}
                                l 0,-${heightCurrentBar -
                                    this.gantt.options.padding / 2 -
                                    this.gantt.options.bar_height / 2}
                                l ${connector_horizontal},0
                                l ${circle_radius / 2},0
                                m -5 -5
                                l 5 5
                                l -5 5`;
                } else {
                }
            } else {
                end_x =
                    this.gantt.options.padding / 2 +
                    start_x +
                    this.from_task.$bar.getWidth() -
                    (connector_horizontal +
                        this.to_task.$bar.getWidth() / 2 +
                        this.gantt.options.padding);

                /**
                 *              -   To right diagram:
                 *
                 *                                ┌──►[///BAR2///]
                 *                  [///BAR1///]■─┘
                 */

                const mid =
                    (this.to_task.$bar.getX() -
                        connector_horizontal -
                        (this.from_task.$bar.getX() +
                            connector_horizontal +
                            this.from_task.$bar.getWidth())) /
                    2;
                this.path = `M ${start_x} ${start_y}
                            L ${start_x + connector_horizontal + mid},${start_y}
                            L ${start_x + connector_horizontal + mid},${end_y +
                    connector_vertical}
                            L ${this.to_task.$bar.getX() -
                                circle_radius / 2},${end_y + connector_vertical}
                            m -5 -5
                            l 5 5
                            l -5 5`;

                if (!condition()) {
                    /**
                     *
                     *      Multi jump row
                     *              -   To left diagram
                     *                       ┌──►[///BAR2///]
                     *                       └────────┐
                     *                  [///BAR1///]■─┘
                     */
                    end_x =
                        this.from_task.$bar.getX() -
                        connector_horizontal * 2 +
                        this.from_task.$bar.getWidth();
                    this.path = `M ${start_x} ${start_y}
                                l ${connector_horizontal},0
                                l 0, -${connector_vertical}
                                l 0,-${connector_vertical - heightBar / 2}
                                L ${this.to_task.$bar.getX() -
                                    connector_horizontal -
                                    this.gantt.options.padding / 2},${start_y -
                        connector_vertical}
                                l 0,${-connector_vertical}
                                l ${connector_horizontal + circle_radius / 2},0
                                m -5 -5
                                l 5 5
                                l -5 5`;
                }
            }
        }

        // if (is_top_to_bottom()) {
        //     if (heightCurrentBar > heightBar) {
        //         if (end_x > heightCurrentBar) {
        //             this.path = `M ${start_x - 10} ${start_y}
        //                 l 10,0
        //                 l 0,20
        //                 L ${end_x},${start_y +
        //                 this.gantt.options.padding / 2 +
        //                 this.gantt.options.bar_height / 2 +
        //                 1}
        //                 L ${end_x},${end_y + 15}
        //                 l 0, 5
        //                 l 15,0
        //                 m -5 -5
        //                 l 5 5
        //                 l -5 5`;
        //         }
        //         if (!condition()) {
        //             this.path = `M ${start_x - 10} ${start_y}
        //                 l 10,0
        //                 l 0,20
        //                 l 0, ${heightCurrentBar - this.gantt.options.padding}
        //                 l 5,0
        //                 L ${end_x +
        //                     5 +
        //                     this.gantt.options.padding / 2},${end_y + 20}
        //                 m -5 -5
        //                 l 5 5
        //                 l -5 5`;
        //         }
        //     } else {
        //         if (!condition()) {
        //             this.path = `M ${start_x - 10} ${start_y}
        //             l 10,0
        //             l 0,40
        //             L ${end_x + 15},${end_y + 20}
        //             m -5 -5
        //             l 5 5
        //             l -5 5`;
        //         }
        //     }
        // } else if (!is_top_to_bottom()) {
        //     if (heightCurrentBar < heightBar) {
        //         this.path = `M ${start_x - 10} ${start_y}
        //                 l 10,0
        //                 l 0,20
        //                 L ${end_x},${start_y +
        //             this.gantt.options.padding / 2 +
        //             this.gantt.options.bar_height / 2}
        //                 L ${end_x},${end_y + 20}

        //                 l 15,0
        //                 m -5 -5
        //                 l 5 5
        //                 l -5 5`;
        //         if (!condition()) {
        //             this.path = `M ${start_x - 10} ${start_y}
        //                         l 20,0
        //                         l ${(end_x - start_x) / 2 - 5},0
        //                         l 0, ${heightCurrentBar + 2}
        //                         l 5,0
        //                         L ${end_x +
        //                             5 +
        //                             this.gantt.options.padding / 2},${end_y +
        //                 20}
        //                         m -5 -5
        //                         l 5 5
        //                         l -5 5`;
        //         }
        //     } else {
        //         if (!condition()) {
        //             this.path = `M ${start_x - 10} ${start_y}
        //             l 10,0
        //             l 0,-36
        //             L ${end_x + 15},${start_y -
        //                 this.gantt.options.header_height +
        //                 this.gantt.options.bar_height / 2 +
        //                 4}
        //             m -5 -5
        //             l 5 5
        //             l -5 5`;
        //         }
        //     }
        // }
    }
}

class Popup {
    constructor(parent, custom_html) {
        this.parent = parent;
        this.custom_html = custom_html;
        this.make();
    }

    make() {
        this.parent.innerHTML = `
            <div class="title"></div>
            <div class="subtitle"></div>
            <div class="pointer"></div>
        `;

        this.hide();

        this.title = this.parent.querySelector('.title');
        this.subtitle = this.parent.querySelector('.subtitle');
        this.pointer = this.parent.querySelector('.pointer');
    }

    show(options) {
        if (!options.target_element) {
            throw new Error('target_element is required to show popup');
        }
        if (!options.position) {
            options.position = 'left';
        }
        const target_element = options.target_element;

        if (this.custom_html) {
            let html = this.custom_html(options.task);
            html += '<div class="pointer"></div>';
            this.parent.innerHTML = html;
            this.pointer = this.parent.querySelector('.pointer');
        } else {
            // set data
            this.title.innerHTML = options.title;
            this.subtitle.innerHTML = options.subtitle;
            this.parent.style.width = this.parent.clientWidth + 'px';
        }

        // set position
        let position_meta;
        if (target_element instanceof HTMLElement) {
            position_meta = target_element.getBoundingClientRect();
        } else if (target_element instanceof SVGElement) {
            position_meta = options.target_element.getBBox();
        }

        if (options.position === 'left') {
            this.parent.style.left =
                position_meta.x + (position_meta.width + 10) + 'px';
            this.parent.style.top = position_meta.y + 'px';

            this.pointer.style.transform = 'rotateZ(90deg)';
            this.pointer.style.left = '-7px';
            this.pointer.style.top = '2px';
        }

        // show
        this.parent.style.opacity = 1;
    }

    hide() {
        this.parent.style.opacity = 0;
    }
}

class Marker {
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

        const diff = date_utils.diff(time, gantt_start, 'minutes') / 60;
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
        marker.setAttribute('x1', this.x);
        marker.setAttribute('x2', this.x);
        markerBox.setAttribute('x', this.x);
        markerText.setAttribute('x', this.x + 10);
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

class Task {
    constructor(gantt, task) {
        this.set_defaults(gantt, task);
    }
    set_defaults(gantt, task) {
        this.gantt = gantt;
        Object.keys(
            Object.assign({}, task, {
                dependencies: task.dependencies || []
            })
        ).map(key => {
            this[key] = task[key];
        });
    }
    get_row() {
        return this._index;
    }
    is_parent() {
        return (
            this.gantt.tasks.filter(task => {
                return task.dependencies.includes(this.id);
            }).length > 0
        );
    }
    is_dependent(t) {}
}

class Milestone extends Bar {
    constructor(gantt, task) {
        super(gantt, task);
        this.set_defaults(gantt, task);
        this.prepare();
        this.draw();
        this.bind();
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
        const task_start = this.task._start_date;
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
        this.width = this.gantt.options.column_width - 20;
        this.group = createSVG('g', {
            class: 'bar-wrapper ' + (this.task.custom_class || ''),
            'data-id': this.task.id
        });
        this.bar_group = createSVG('g', {
            class: 'bar-group',
            append_to: this.group
        });
        this.link_group = createSVG('g', {
            class: 'link-group',
            append_to: this.group
        });
    }
    draw() {
        this.draw_bar();
        this.draw_label();
        this.draw_connector();
    }
    update_milestone_position() {
        this.$bar.setAttribute('x', this.$bar.getX());
        this.$bar.setAttribute(
            'd',
            `M${this.$bar.getX() + this.gantt.options.padding},${this.y} 
            l -${this.gantt.options.bar_height / 2},${this.gantt.options
                .bar_height / 2} 
            l ${this.gantt.options.bar_height / 2},${this.gantt.options
                .bar_height / 2}
            l ${this.gantt.options.bar_height / 2},-${this.gantt.options
                .bar_height / 2}
            l -${this.gantt.options.bar_height / 2},-${this.gantt.options
                .bar_height / 2}`
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
            width: this.gantt.options.padding * 2,
            height: this.gantt.options.padding * 2,
            d: `M${this.x + this.gantt.options.padding},${this.y} 
            l -${this.gantt.options.bar_height / 2},${this.gantt.options
                .bar_height / 2} 
            l ${this.gantt.options.bar_height / 2},${this.gantt.options
                .bar_height / 2}
            l ${this.gantt.options.bar_height / 2},-${this.gantt.options
                .bar_height / 2}
            l -${this.gantt.options.bar_height / 2},-${this.gantt.options
                .bar_height / 2}`,
            class: 'milestone',
            append_to: this.bar_group
        });
    }
    update_label_position() {
        const bar = this.$bar,
            label = this.group.querySelector('.bar-label');

        label.classList.add('big');
        label.setAttribute('x', bar.getX() + bar.getWidth() + 5 + 7.5);
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

        this.update_connector_position();
    }
}

/**
 * debouncing, executes the function if there was no new event in $wait milliseconds
 * @param func
 * @param wait
 * @param scope
 * @returns {Function}
 */

/**
 * in case of a "storm of events", this executes once every $threshold
 * @param fn
 * @param threshhold
 * @param scope
 * @returns {Function}
 */

function throttle(fn, threshhold, scope) {
    threshhold || (threshhold = 250);
    var last, deferTimer;
    return function() {
        var context = scope || this;

        var now = +new Date(),
            args = arguments;
        if (last && now < last + threshhold) {
            // hold on to it
            clearTimeout(deferTimer);
            deferTimer = setTimeout(function() {
                last = now;
                fn.apply(context, args);
            }, threshhold);
        } else {
            last = now;
            fn.apply(context, args);
        }
    };
}

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
//  https://codepen.io/osublake/pen/4c3752574267b3a986cb8eee7ccb8c81
class Gantt {
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
        options.groups = (options.groups || []).reduce((dict, curr) => {
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
            task._start_date = date_utils.parse(task.start_date);
            task._end_date = date_utils.parse(task.end_date);
            if (task.planned_start && task.planned_end) {
                task._planned_start = date_utils.parse(task.planned_start);
                task._planned_end = date_utils.parse(task.planned_end);
            }

            // make task invalid if duration too large
            if (
                date_utils.diff(task._end_date, task._start_date, 'year') > 10
            ) {
                task.end_date = null;
            }

            if (
                date_utils.diff(
                    task._planned_end,
                    task._planned_start,
                    'year'
                ) > 10
            ) {
                task.planned_end = null;
            }

            // cache index
            task._index = i;

            // invalid dates
            if (!task.start_date && !task.end_date) {
                const today = date_utils.today();
                task._start_date = today;
                task._end_date = date_utils.add(today, 2, 'day');
            }

            if (!task.start_date && task.end_date) {
                task._start_date = date_utils.add(task._end_date, -2, 'day');
            }

            if (task.start_date && !task.end_date) {
                task._end_date = date_utils.add(task._start_date, 2, 'day');
            }

            // if hours is not set, assume the last day is full day
            // e.g: 2018-09-09 becomes 2018-09-09 23:59:59
            const task_end_values = date_utils.get_date_values(task._end_date);
            if (task_end_values.slice(3).every(d => d === 0)) {
                task._end_date = date_utils.add(task._end_date, 24, 'hour');
            }

            // invalid flag
            if (!task.start_date || !task.end_date) {
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
            if (!this.gantt_start || task._start_date < this.gantt_start) {
                this.gantt_start = task._start_date;
            }
            if (!this.gantt_end || task._end_date > this.gantt_end) {
                this.gantt_end = task._end_date;
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

        this.make_planned();
        this.setup_layers();
        this.make_grid();
        this.make_dates();
        this.make_bars();
        this.make_arrows();
        this.map_arrows_on_bars();
        this.set_width();
        this.set_scroll_position();
    }

    make_planned() {
        let defs = createSVG('defs', {
            append_to: this.$svg
        });
        let pattern = createSVG('pattern', {
            id: 'pattern-stripe',
            width: 4,
            height: 4,
            patternUnits: 'userSpaceOnUse',
            patternTransform: 'rotate(45)',
            append_to: defs
        });
        createSVG('rect', {
            id: 'pattern-stripe',
            width: 2,
            height: 4,
            transform: 'translate(0,0)',
            fill: 'white',
            append_to: pattern
        });
        let mask = createSVG('mask', {
            id: 'mask-stripe',
            append_to: defs
        });
        createSVG('rect', {
            x: 0,
            y: 0,
            width: '100%',
            height: '100%',
            fill: 'url(#pattern-stripe)',
            append_to: mask
        });
    }
    setup_layers() {
        this.layers = {};
        const layers = [
            'grid',
            'planned',
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
            height: grid_height,
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
                if (task.planned_start && task.planned_end) {
                    const bar_planned = new BarPlanned(this, task);
                    this.layers.planned.appendChild(bar_planned.group);
                }

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
                    this.layers.arrow.appendChild(arrow.group);
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

        this.layers.arrow.appendChild(arrow.group);
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
        let radius = 0;
        let link_path = document.getElementById('path-link');
        let task_id = '';

        const action_in_progress = () => {
            return (
                is_dragging ||
                is_resizing_left ||
                is_resizing_right ||
                is_linking
            );
        };

        $.on(
            this.$svg,
            'mousedown',
            '.bar-wrapper, .handle, .handle-link',
            (e, element) => {
                e.preventDefault();
                try {
                    const bar_wrapper = $.closest('.bar-wrapper', element);
                    task_id = bar_wrapper.getAttribute('data-id');

                    x_on_start = e.offsetX;
                    y_on_start = e.offsetY;

                    if (element.classList.contains('handle-link')) {
                        this.get_bar(task_id).stop_click_event();
                        is_linking = true;
                        is_input_link = !element.classList.contains(
                            'link-output'
                        );

                        //  handle-dependency
                        const $link_wrapper = $.closest(
                            '.link-connector',
                            element
                        );
                        const link = $link_wrapper.querySelector(
                            '.handle-link'
                        );
                        const circle = $link_wrapper.querySelector(
                            '.circle-link'
                        );

                        connector_from = $link_wrapper;
                        dependency_from = circle;
                        dependency_from_linking = link;

                        x_on_start = +circle.getAttribute('cx');
                        y_on_start = +circle.getAttribute('cy');
                        radius = +circle.getAttribute('r');

                        link_path.setAttribute('x1', x_on_start);
                        link_path.setAttribute('y1', y_on_start);
                        connector_from.classList.add('connector');
                        this.layers.bar.classList.add('in-connection');

                        //  fix before elements connect
                        // try {
                        //     const bar = e.target.closest('.bar');
                        //     bar.insertBefore(connector_from, bar.firstChild);
                        // } catch (error) {}
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
                } catch (error) {}
            }
        );

        const mouseMoveHandler = e => {
            e.preventDefault();
            if (!action_in_progress()) return;
            if (is_linking) {
                const dx = e.offsetX;
                const dy = e.offsetY;
                link_path.setAttribute('x2', dx - radius / 2);
                link_path.setAttribute('y2', dy - radius / 2);
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
            e.preventDefault();
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
                this.get_bar(task_id).setup_click_event();
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
        this.popup_wrapper.style = '';
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
            .map(task => task._start_date)
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

return Gantt;

}());
