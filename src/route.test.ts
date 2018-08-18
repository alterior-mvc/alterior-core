import { CONTROLLER_CLASSES, Controller as _Controller } from './controller';
import { Get, Post, Put, Patch, Delete, Options, RouteEvent } from './route';
import { suite, test as it } from 'mocha-typescript';
import * as assert from 'assert';
import * as express from 'express';
import * as http from 'http';
import * as bodyParser from 'body-parser';

import { HttpException } from './errors';

import { AppOptions } from './application';
import { bootstrap } from './bootstrap';
import * as supertest from 'supertest';

describe("route", () => {
	@suite class RouteDecorator {
		
		@it 'should register routes defined on controllers and respond to them' (done) {

			@_Controller()
			class TestController {
				@Get('/foo')
				foo(req : express.Request, res : express.Response) {
					res.status(200).send(JSON.stringify({foo:123}));
				}
			}

			@AppOptions({ port: 10001, silent: true,
				autoRegisterControllers: false,
				controllers: [TestController],
				middleware: [
					(req, res, next) => { res.header('Content-Type', 'application/json'); next(); }
				]
			}) 
			class FakeApp {
			}

			bootstrap(FakeApp).then(app => {
				supertest(app.express).get('/foo')
					.expect(200, <any>{
						foo: 123
					}).end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}

		fakeAppVarietyOfMethods()
		{
			@_Controller()
			class TestController {
				@Get('/foo')
				getX(req : express.Request, res : express.Response) {
					res.status(200).send(JSON.stringify({foo:"get"}));
				}

				@Post('/foo')
				postX(req : express.Request, res : express.Response) {
					res.status(200).send(JSON.stringify({foo:"post"}));
				}

				@Put('/foo')
				putX(req : express.Request, res : express.Response) {
					res.status(200).send(JSON.stringify({foo:"put"}));
				}

				@Patch('/foo')
				patchX(req : express.Request, res : express.Response) {
					res.status(200).send(JSON.stringify({foo:"patch"}));
				}

				@Delete('/foo')
				deleteX(req : express.Request, res : express.Response) {
					res.status(200).send(JSON.stringify({foo:"delete"}));
				}

				@Options('/foo')
				optionsX(req : express.Request, res : express.Response) {
					res.status(200).send(JSON.stringify({foo:"options"}));
				}
			}

			@AppOptions({ port: 10001, silent: true,
				autoRegisterControllers: false,
				controllers: [TestController],
				middleware: [
					(req, res, next) => { res.header('Content-Type', 'application/json'); next(); }
				]
			}) 
			class FakeApp {
			}

			return FakeApp;
		}

		@it 'should allow a method to return a promise' (done) {

			@_Controller()
			class TestController {
				@Get('/foo')
				getX(req : express.Request, res : express.Response) {
					return Promise.resolve({foo:"we promised"});
				}
			}

			@AppOptions({ port: 10001, silent: true,
				autoRegisterControllers: false,
				controllers: [TestController],
				middleware: [
					(req, res, next) => { res.header('Content-Type', 'application/json'); next(); }
				]
			}) 
			class FakeApp {
			}

			bootstrap(FakeApp).then(app => {
				supertest(app.express)
					.get('/foo')
					.expect(200, <any>{ foo: "we promised" })
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}
 
		@it 'should allow a method to return null as a JSON value' (done) {

			@_Controller()
			class TestController {
				@Get('/foo')
				getX(req : express.Request, res : express.Response) {
					return null;
				}
			}

			@AppOptions({ port: 10001, silent: true,
				autoRegisterControllers: false,
				controllers: [TestController],
				middleware: [
					(req, res, next) => { res.header('Content-Type', 'application/json'); next(); }
				]
			}) 
			class FakeApp {
			}

			bootstrap(FakeApp).then(app => {
				supertest(app.express)
					.get('/foo')
					.expect(200, <any>null)
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}

		@it 'should bind parameter `session` to `request.session`' (done) {

			@_Controller()
			class TestController {
				@Get('/foo')
				getX(session : any) {
					return Promise.resolve({foo:session.test});
				}
			}

			@AppOptions({ port: 10001, silent: true,
				autoRegisterControllers: false,
				controllers: [TestController],
				middleware: [
					(req, res, next) => {
						req.session = { test: 123 }; 
						res.header('Content-Type', 'application/json'); 
						next(); 
					}
				]
			}) 
			class FakeApp {
			}

			bootstrap(FakeApp).then(app => {
				supertest(app.express)
					.get('/foo')
					.expect(200, <any>{ foo: 123 })
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}

		@it 'should allow a method to return an explicit body value' (done) {

			@_Controller()
			class TestController {
				@Get('/foo')
				getX(req : express.Request, res : express.Response) {
					return {foo:"we promised"};
				}
			}

			@AppOptions({ port: 10001, silent: true,
				autoRegisterControllers: false,
				controllers: [TestController],
				middleware: [
					(req, res, next) => { res.header('Content-Type', 'application/json'); next(); }
				]
			}) 
			class FakeApp {
			}

			bootstrap(FakeApp).then(app => {
				supertest(app.express)
					.get('/foo')
					.expect(200, <any>{ foo: "we promised" })
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);

						done();	
					});
			});
		}

		@it 'should re-encode a string return value as JSON' (done) {

			@_Controller()
			class TestController {
				@Get('/foo')
				getX(req : express.Request, res : express.Response) {
					return "token value";
				}
			}

			@AppOptions({ port: 10001, silent: true,
				autoRegisterControllers: false,
				controllers: [TestController],
				middleware: [
					(req, res, next) => { res.header('Content-Type', 'application/json'); next(); }
				] 
			}) 
			class FakeApp {
			}

			bootstrap(FakeApp).then(app => {
				supertest(app.express)
					.get('/foo')
					.expect(200, <any>'"token value"')
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);

						done();	
					});
			});
		}

		@it 'should 500 when a method returns a promise that rejects' (done) {

			@_Controller()
			class TestController {
				@Get('/foo')
				getX(req : express.Request, res : express.Response) {
					return Promise.reject(new Error("All the things went wrong"));
				}
			}

			@AppOptions({ port: 10001, silent: true,
				autoRegisterControllers: false,
				controllers: [TestController],
				middleware: [
					(req, res, next) => { res.header('Content-Type', 'application/json'); next(); }
				]
			}) 
			class FakeApp {
			}

			bootstrap(FakeApp).then(app => {
				supertest(app.express)
					.get('/foo')
					.expect(500)
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}

		@it 'should act accordingly when a method returns a promise that rejects with an HttpException' (done) {

			@_Controller()
			class TestController {
				@Get('/foo')
				getX(req : express.Request, res : express.Response) {
					return Promise.reject(new HttpException(300, [['X-Test', 'pass']], {bar:777}));
				}
			}

			@AppOptions({ port: 10001, silent: true,
				autoRegisterControllers: false,
				controllers: [TestController],
				middleware: [
					(req, res, next) => { res.header('Content-Type', 'application/json'); next(); }
				]
			}) 
			class FakeApp {
			}

			bootstrap(FakeApp).then(app => {
				supertest(app.express)
					.get('/foo')
					.expect(300, <any>{
						bar: 777
					})
					.expect('X-Test', 'pass')
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}

		@it 'should include the stack trace of a caught Error in a 500 response' (done) {

			let error = new Error('testytest');
			let stackText = error.stack;

			@_Controller()
			class TestController {
				@Get('/foo')
				getX(req : express.Request, res : express.Response) {
					throw error;
				}
			}

			@AppOptions({ port: 10001, silent: true,
				autoRegisterControllers: false,
				controllers: [TestController],
				middleware: [
					(req, res, next) => { res.header('Content-Type', 'application/json'); next(); }
				]
			}) 
			class FakeApp {
			}

			bootstrap(FakeApp).then(app => {
				supertest(app.express)
					.get('/foo')
					.expect(500, <any>{
						message: 'An exception occurred while handling this request.',
						error: stackText
					})
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}

		@it 'should include a caught throwable in a 500 response' (done) {

			@_Controller()
			class TestController {
				@Get('/foo')
				getX(req : express.Request, res : express.Response) {
					throw { foo: "bar" }
				}
			}

			@AppOptions({ port: 10001, silent: true,
				autoRegisterControllers: false,
				controllers: [TestController],
				middleware: [
					(req, res, next) => { res.header('Content-Type', 'application/json'); next(); }
				]
			}) 
			class FakeApp {
			}

			bootstrap(FakeApp).then(app => {
				supertest(app.express)
					.get('/foo')
					.expect(500, <any>{
						message: 'An exception occurred while handling this request.',
						error: {foo: "bar"}
					})
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}

		@it 'should exclude exception information when `hideExceptions` is true' (done) {

			@_Controller()
			class TestController {
				@Get('/foo')
				getX(req : express.Request, res : express.Response) {
					throw { toString: () => "testytest" }
				}
			}

			@AppOptions({ port: 10001, silent: true,
				autoRegisterControllers: false,
				hideExceptions: true,
				controllers: [TestController],
				middleware: [
					(req, res, next) => { res.header('Content-Type', 'application/json'); next(); }
				]
			}) 
			class FakeApp {
			}

			bootstrap(FakeApp).then(app => {
				supertest(app.express)
					.get('/foo')
					.expect(500, <any>{
						message: 'An exception occurred while handling this request.'
					})
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}

		@it 'should apply route-specific middleware' (done) {

			@_Controller()
			class TestController {
				@Get('/foo', {
					middleware: [
						(req, res, next) => {
							req.fun = 'funfun';
							next();
						}
					]
				})
				getX(req : express.Request, res : express.Response) {
					return req['fun'];
				}
			}

			@AppOptions({ port: 10001, silent: true,
				autoRegisterControllers: false,
				controllers: [TestController],
				middleware: [
					(req, res, next) => { res.header('Content-Type', 'application/json'); next(); }
				]
			}) 
			class FakeApp {
			}

			bootstrap(FakeApp).then(app => {
				supertest(app.express)
					.get('/foo')
					.expect(200, <any>'"funfun"')
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}

		@it 'should be injecting express URL parameters when appropriate' (done) {
			
			@_Controller()
			class TestController {
				@Get('/foo/:bar/:baz')
				getX(bar : string, baz : string) {
					assert(bar == '123');
					assert(baz == '321');
					return Promise.resolve({ok: true});
				}
			}

			@AppOptions({ port: 10001, silent: true,
				autoRegisterControllers: false,
				controllers: [TestController],
				middleware: [
					(req, res, next) => { res.header('Content-Type', 'application/json'); next(); }
				]
			}) 
			class FakeApp {
			}

			bootstrap(FakeApp).then(app => {
				supertest(app.express)
					.get('/foo/123/321')
					.expect(200, <any>{
						ok: true 
					})
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}

		@it 'should be reading parameter type metadata to discover how to provide parameters' (done) {

			@_Controller()
			class TestController {
				@Get('/foo')
				getX(res : express.Response, req : express.Request) { // note they are swapped
					assert(res.send);
					assert(req.path);

					return Promise.resolve({ok: true});
				}
			}

			@AppOptions({ port: 10001, silent: true,
				autoRegisterControllers: false,
				controllers: [TestController],
				middleware: [
					(req, res, next) => { res.header('Content-Type', 'application/json'); next(); }
				]
			}) 
			class FakeApp {
			}

			bootstrap(FakeApp).then(app => {
				supertest(app.express)
					.get('/foo')
					.expect(200, <any>{
						ok: true 
					})
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}

		@it 'should be able to inject body when the body parsing middleware is used' (done) {

			interface MyRequestType {
				zoom : number;
			}

			@_Controller()
			class TestController {
				@Post('/foo')
				getX(body : MyRequestType) { 
					assert(body.zoom === 123);
					return Promise.resolve({ok: true});
				}
			}

			@AppOptions({ port: 10001, silent: true,
				autoRegisterControllers: false,
				controllers: [TestController],
				middleware: [
					bodyParser.json(),
					(req, res, next) => { res.header('Content-Type', 'application/json'); next(); }
				]
			}) 
			class FakeApp {
			}

			bootstrap(FakeApp).then(app => {
				supertest(app.express)
					.post('/foo')
					.send({
						zoom: 123
					})
					.expect(200, <any>{
						ok: true 
					})
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}

		@it 'should be able to inject RouteEvent instead of request/response' (done) {

			interface MyRequestType {
				zoom : number;
			}

			@_Controller()
			class TestController {
				@Post('/foo')
				getX(ev : RouteEvent) { 
					assert(ev.request.path);
					assert(ev.response.send);
					return Promise.resolve({ok: true});
				}
			}

			@AppOptions({ port: 10001, silent: true,
				autoRegisterControllers: false,
				controllers: [TestController],
				middleware: [
					bodyParser.json(),
					(req, res, next) => { res.header('Content-Type', 'application/json'); next(); }
				]
			}) 
			class FakeApp {
			} 

			bootstrap(FakeApp).then(app => {
				supertest(app.express)
					.post('/foo')
					.send({
						zoom: 123
					})
					.expect(200, <any>{
						ok: true 
					})
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}

		@it 'should support POST' (done) {

			bootstrap(this.fakeAppVarietyOfMethods()).then(app => {
				supertest(app.express)
					.post('/foo')
					.expect(200, <any>{ foo: "post" })
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}

		@it 'should support PUT' (done) {

			bootstrap(this.fakeAppVarietyOfMethods()).then(app => {
				supertest(app.express)
					.put('/foo')
					.expect(200, <any>{ foo: "put" })
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}

		@it 'should support PATCH' (done) {

			bootstrap(this.fakeAppVarietyOfMethods()).then(app => {
				supertest(app.express)
					.patch('/foo')
					.expect(200, <any>{ foo: "patch" })
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}

		@it 'should support DELETE' (done) {

			bootstrap(this.fakeAppVarietyOfMethods()).then(app => {
				supertest(app.express)
					.delete('/foo')
					.expect(200, <any>{ foo: "delete" })
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}

		@it 'should support OPTIONS' (done) {

			bootstrap(this.fakeAppVarietyOfMethods()).then(app => {
				supertest(app.express)
					.options('/foo')
					.expect(200, <any>{ foo: "options" })
					.end((err, res) => {
						app.stop();
						if (err) 
							return done(err);
						done();	
					});
			});
		}
	}
});