export default class Task {
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
