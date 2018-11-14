import { Annotation } from "@alterior/annotations";
import { Injectable, InjectionToken, Optional } from "@alterior/di";
import { Module } from "@alterior/di";
import * as Queue from "bull";
import { Inject } from "injection-js";

export interface TaskWorkerOptions extends TaskClientOptions {
    verbose? : boolean;
	silent? : boolean;
}

export interface TaskClientOptions {
    queueOptions? : Queue.QueueOptions;
    queueName? : string;
}


@Injectable()
export class TaskClientOptionsRef {
    constructor(options : TaskClientOptions) {
        this.options = options;
    }

    public options : TaskClientOptions;
}

@Injectable()
export class TaskWorkerOptionsRef {
    constructor(options : TaskWorkerOptions) {
        this.options = options;
    }

    public options : TaskWorkerOptions;
}

export interface TaskJob {
    id : string;
    method : string;
    args : any[];
}

export const QUEUE_OPTIONS = new InjectionToken<Queue.QueueOptions>('QueueOptions');

export class TaskAnnotation extends Annotation {
    constructor(readonly id? : string) {
        super();
    }
}

export const Task = TaskAnnotation.decorator();