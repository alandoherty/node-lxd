/**
     __   _  __ ____
    / /  | |/ // __ \
   / /   |   // / / /
  / /___/   |/ /_/ /
 /_____/_/|_/_____/

 @author Alan Doherty (BattleCrate Ltd.)
 @license MIT
 **/

var utils = require("../utils");

// export
module.exports = utils.class_("TaskQueue", {
    /**
     * The tasks to perform.
     * @private
     */
    _tasks: [],

    /**
     * The number of tasks which have finished.
     * @private
     */
    _tasksDone: -1,

    /**
     * The number of tasks todo.
     * @private
     */
    _tasksTodo: -1,

    /**
     * The current tasks completion callback.
     * @private
     */
    _tasksCallback: null,

    /**
     * @private
     */
    _executing: false,

    /**
     * Gets if the task queue is executing.
     * @returns {boolean}
     */
    isExecuting: function() {
        return this._executing;
    },

    /**
     * Queues a task.
     * @param {function} taskFunc The task to complete.
     * @param {boolean?} async
     */
    queue: function(taskFunc, async) {
        this._tasks.push({func: taskFunc, async: async == undefined ? false : async});

        if (this.isExecuting())
            this._tasksTodo++;
    },

    /**
     * Dequeues a task.
     * @returns {object|null}
     */
    dequeue: function() {
        // check if all tasks completed
        if (this._tasks.length == 0)
            return null;

        // shift
        return this._tasks.shift();
    },

    /**
     * Executes all tasks in the queue.
     * @param {function} callback The callback upon completion.
     */
    executeAll: function(callback) {
        // check for existing execution
        if (this._tasksTodo != -1)
            throw "a pending executeAll is already in progress";

        // check if queue empty
        if (this._tasks.length == 0) {
            callback();
            return;
        }

        // start executing tasks
        this._tasksTodo = this._tasks.length;
        this._tasksDone = 0;
        this._tasksCallback = callback;
        this._executeNext();
    },

    /**
     * Executes the next task.
     * @private
     */
    _executeNext: function() {
        // dequeue next task
        var task = this.dequeue();

        if (task == null)
            return;

        // execute
        var queue = this;

        task.func(function() {
            queue._tasksDone++;

            if (queue._tasksDone == queue._tasksTodo) {
                // reset and callback
                queue._tasksDone = -1;
                queue._tasksTodo = -1;
                queue._executing = false;
                queue._tasksCallback();
            } else {
                // execute next
                if (task.async == false)
                    queue._executeNext();
            }
        });

        // if async, execute the next awaiting task
        if (task.async == true)
            this._executeNext();
    },

    /**
     * Creates a new task queue.
     */
    constructor: function() {
        this._tasks = [];
        this._tasksTodo = -1;
        this._tasksDone = -1;
        this._tasksCallback = null;
        this._executing = false;
    }
});