import { WebServer } from "./web-server";
import { Provider, ReflectiveInjector, Injector } from "@alterior/di";
import { RouteInstance } from './route';
import { ControllerAnnotation, ControllerOptions, MountOptions, RouteReflector } from "./metadata";
import * as express from 'express';

export class ControllerRegistrar {
	constructor(readonly server : WebServer) {
	}

	private _controllers : ControllerInstance[] = [];

	public get controllers() {
		return this._controllers.slice();
	}
    
	register(controllers : Function[]) {
		let providers : Provider[] = controllers as Provider[];
        let ownInjector = ReflectiveInjector.resolveAndCreate(providers, this.server.injector);
		let allRoutes = [];

		this._controllers = controllers.map(type => new ControllerInstance(this.server, type, ownInjector, allRoutes));
		this._controllers.forEach(c => c.mount(this.server.express));
	}
}

export interface ControllerContext {
	pathPrefix? : string;
	middleware? : Function[];

	/* PRIVATE */

	visited? : any[];
}

/**
 * Represents an instance of a controller, which can be used to handle requests.
 */
export class ControllerInstance {
	constructor(
		readonly server : WebServer,
		readonly type : Function, 
		readonly injector : Injector, 
		readonly routeTable : any[], 
		context? : ControllerContext
	) {
		this.setContext(context);
		this.prepare();
	}

	private _instance : any;

	get instance() {
		return this._instance;
	}

	private setContext(context : ControllerContext) {
		if (!context)
			context = {};

		if (!context.pathPrefix)
			context.pathPrefix = '';
	
		if (!context.visited)
			context.visited = [];

		if (context.visited.includes(this.type)) {
			console.warn(`Controller visited multiple times and skipped. May indicate recursion.`);
			return;
		}
		
		context.visited.push(this.type);
		this._context = context;
	}

	private _context : ControllerContext;
	get context() {
		return this._context;
	}

	get middleware() {
		let middleware = [];
		if (this.context.middleware)
			middleware = middleware.concat(this.context.middleware);
		if (this.options.middleware)
			middleware = middleware.concat(this.options.middleware);

		return middleware;
	}

	combinePaths(...paths) {
		let finalPath = '';

		for (let path of paths) {
			let segment = path ? path.replace(/^\/|\/$/g, '') : undefined;
			if (segment)
				finalPath += `/${segment}`;
		}

		finalPath = finalPath.replace(/^\/|\/$/g, '');

		if (!finalPath || finalPath === '/')
			return '';
		
		return '/' + finalPath;
	}

	private prepare() {
		this._instance = this.injector.get(this.type);

		// Reflect upon our routes


		let routeReflector = new RouteReflector(this.type);
		let routeDefinitions = routeReflector.routes;
		let controllerMetadata = ControllerAnnotation.getForClass(this.type);
		let controllerOptions = controllerMetadata ? controllerMetadata.options : {} || {};
		this._options = controllerOptions;

		for (let mount of routeReflector.mounts) {
			let providers : Provider[] = (mount.options || {} as MountOptions).providers || [];
			let controllers = (mount.controllers || []).slice();
			let controllerType = Reflect.getMetadata('design:type', this.type.prototype, mount.propertyKey);
			
			if (typeof controllerType === 'function' && controllerType !== Object)
				controllers.push(controllerType);

			providers.push(...(controllers as Provider[]));

			let mountInjector : ReflectiveInjector;
			
			try {
				mountInjector = ReflectiveInjector.resolveAndCreate(providers, this.injector);
			} catch (e) {
				console.error(`Failed to resolve and create dependency injector for mount with path '${mount.path}'`);
				console.error(e);
				throw e;
			}

			for (let controller of controllers) {
				let subPrefix = this.combinePaths(
					this.context.pathPrefix, 
					this._options.basePath,
					mount.path
				);
				this.controllers.push(new ControllerInstance(
					this.server, 
					controller, 
					mountInjector, 
					this.routeTable, 
					{
						pathPrefix: subPrefix,
						middleware: this.middleware
					}
				));
			}
		}

		// Register all of our routes with Express

		this._routes = routeDefinitions.map(
			definition => new RouteInstance(
				this.server, 
				this.instance,
				this.injector, 
				this.middleware, 
				this.group, 
				this.type, 
				this.routeTable,
				definition
			)
		);
	}

	private _routes : RouteInstance[];

	get pathPrefix() {
		return this.combinePaths(this._context.pathPrefix, this._options.basePath);
	}
	
	get routes() {
		return this._routes;
	}

	private _controllers : ControllerInstance[] = [];

	get controllers() {
		return this._controllers;
	}

	private _options : ControllerOptions;

	get options() {
		return this._options;
	}

	get group(): string {
		let controllerGroup : string = undefined;
		
		if (this._options && this._options.group) {
			controllerGroup = this._options.group;
		} else {
			controllerGroup = this.type.name.replace(/Controller$/, '');
			controllerGroup = controllerGroup.charAt(0).toLowerCase()+controllerGroup.slice(1);
		}

		return controllerGroup;
	}

	mount(app : express.Application) {
		this.routes.forEach(r => r.mount(this.pathPrefix));
		this.controllers.forEach(c => c.mount(app));
	}
}