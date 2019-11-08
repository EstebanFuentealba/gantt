import { createSVG } from './svg_utils';
import Arrow from './arrow';

export default class ArrowRect extends Arrow {
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
         *                                ┌──»[///BAR2///]
         *                  [///BAR1///]■─┘
         *              -   To left diagram
         *                       ┌──»[///BAR2///]
         *                       └────────┐
         *                  [///BAR1///]■─┘
         *      -   top to bottom:
         *              -   To right diagram
         *                  [///BAR1///]■─┐
         *                                └──»[///BAR2///]
         *              -   To left diagram
         *                  [///BAR1///]■─┐
         *                       ┌────────┘
         *                       └──»[///BAR2///]
         *
         */

        const condition = () => {
            //  bottom to top condition
            if (!is_top_to_bottom()) {
                console.log(
                    'condition',
                    start_x + connector_horizontal,
                    this.to_task.$bar.getX() -
                        this.gantt.options.padding / 2 +
                        circle_radius +
                        circle_separator
                );
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
            } else {
                return true;
            }

            console.log(
                this.to_task.task.id,
                start_x,
                '>',
                this.to_task.$bar.getX() -
                    this.gantt.options.padding / 2 +
                    circle_radius +
                    circle_separator
            );

            return (
                this.to_task.$bar.getX() < start_x + connector_horizontal &&
                start_x <= this.to_task.x
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
        const heightCurrentBar = end_y - start_y + this.gantt.options.padding;

        console.log(
            'condition()',
            this.to_task.task.id,
            condition(),
            heightCurrentBar,
            '<',
            heightBar
        );

        if (is_top_to_bottom()) {
            if (heightCurrentBar > heightBar) {
                // if (end_x > heightCurrentBar) {
                //     this.path = `M ${start_x - 10} ${start_y}
                //         l 10,0
                //         l 0,20
                //         L ${end_x},${start_y +
                //         this.gantt.options.padding / 2 +
                //         this.gantt.options.bar_height / 2 +
                //         1}
                //         L ${end_x},${end_y + 15}
                //         l 0, 5
                //         l 15,0
                //         m -5 -5
                //         l 5 5
                //         l -5 5`;
                // }
                // if (!condition()) {
                //     this.path = `M ${start_x - 10} ${start_y}
                //         l 10,0
                //         l 0,20
                //         l 0, ${heightCurrentBar - this.gantt.options.padding}
                //         l 5,0
                //         L ${end_x +
                //             5 +
                //             this.gantt.options.padding / 2},${end_y + 20}
                //         m -5 -5
                //         l 5 5
                //         l -5 5`;
                // }
            } else {
                if (!condition()) {
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
            if (heightCurrentBar < heightBar) {
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
                 *                                ┌──»[///BAR2///]
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
                     *              -   To left diagram
                     *                       ┌──»[///BAR2///]
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
                                l 0,-${connector_vertical}
                                l ${connector_horizontal},0
                                l ${circle_radius / 2},0
                                m -5 -5
                                l 5 5
                                l -5 5`;
                }
            } else {
                console.log('ELSE');
                // if (!condition()) {
                //     this.path = `M ${start_x - 10} ${start_y}
                //     l 10,0
                //     l 0,-36
                //     L ${end_x + 15},${start_y -
                //         this.gantt.options.header_height +
                //         this.gantt.options.bar_height / 2 +
                //         4}
                //     m -5 -5
                //     l 5 5
                //     l -5 5`;
                // }
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
