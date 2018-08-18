import * as assert from 'assert';
import { suite, test as it } from 'mocha-typescript';
import { ApplicationArgs } from './args';
import { bootstrap as _bootstrap } from './bootstrap';
import { AppOptions, OnInit, OnSanityCheck } from './application';

@suite class bootstrap {
	@it async 'should not accept a number for application class'() {

		try {
			await _bootstrap(<any>123);
		} catch (e) {
			return; // expected behavior
		}

		throw new Error("bootstrap should throw when presented with 'class' 123");
	}

	@it async 'should not accept a string for application class'() {

		try {
			await _bootstrap(<any>'fubar');
		} catch (e) {
			return; // expected behavior
		}

		throw new Error("bootstrap should throw when presented with 'class' 'fubar'");
	}

	@it 'should call altOnInit' (done) {

		@AppOptions({ port: 10001, silent: true, autoRegisterControllers: false }) 
		class FakeApp implements OnInit {
			altOnInit() {
				done();
			}
		}

		_bootstrap(FakeApp).then(app => app.stop());
	}

	@it 'should perform basic dependency injection' (done) {

		class SomeDependency {
			public bar = 123;
		}

		@AppOptions({ 
			port: 10001, 
			silent: true,
			providers: [SomeDependency] 
		}) 
		class FakeApp { 
			constructor(foo : SomeDependency) {
				assert.equal(foo.bar, 123);
				done();
			}
		}

		_bootstrap(FakeApp).then(app => app.stop());;
	}

	@it 'should let you override core components' (done) {

		class MockApplicationArgs extends ApplicationArgs {
			constructor(private args : string[]) { 
				super();
			}

			get() {
				return this.args; 
			}
		}

		@AppOptions({ 
			port: 10001, 
			silent: true,
			autoRegisterControllers: false,
			providers: [{ provide: ApplicationArgs, useValue: new MockApplicationArgs(['foo', 'bar'])}] 
		}) 
		class FakeApp { 
			constructor(argsService : ApplicationArgs) {
				let args = argsService.get();

				assert.equal(args[0], 'foo');
				assert.equal(args[1], 'bar');
				done();
			}
		}

		_bootstrap(FakeApp).then(app => app.stop());;
	}

	@it 'should resolve to a valid AppInstance' (done) {

		@AppOptions({ 
			port: 10001, 
			silent: true,
			autoRegisterControllers: false
		}) 
		class FakeApp { 
		}

		_bootstrap(FakeApp).then(app => {
			assert(app.app);
			assert(app.express);
			assert(app.http);
			
			app.stop();
			done();
		});
	}
}