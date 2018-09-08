import { ExpressRef } from "./express-ref";
import { Application } from "@alterior/runtime";
import * as supertest from 'supertest';
import { Module } from "@alterior/di";
import { WebServerModule } from "./web-server.module";
import { WebServerOptions } from "web-server";

/**
 * Create a test setup for the given @alterior/web-server application. You must 
 * depend on `supertest` to use this.
 * 
 * @param app 
 * @param handler 
 */
export async function teststrap(module : Function, handler : (test : supertest.SuperTest<supertest.Test>) => Promise<any>, options? : WebServerOptions) {

    @Module({
        imports: [
            module,
            WebServerModule.configure(
                Object.assign({
                    silent: true,
                    hideExceptions: false,
                    middleware: [
                        (req, res, next) => { 
                            res.header('Content-Type', 'application/json'); 
                            next(); 
                        }
                    ]
                }, options)
            )
        ]
    })
    class RootModule {
    }

    let app = await Application.bootstrap(RootModule, { autostart: false });
    return await runTest(app, async (test, done) => {
        await handler(test);
        done();
    });
}

/**
 * Create a test setup for the given @alterior/web-server application. You must 
 * depend on `supertest` to use this.
 * 
 * @param app 
 * @param handler 
 */
export async function runTest(app : Application, handler : (test : supertest.SuperTest<supertest.Test>, done : Function) => any) {
    let expressRef = app.inject(ExpressRef);
    
    if (!expressRef) {
        throw new Error(`Could not get Express reference`);
    }
	let test = supertest(expressRef.application);

	return await new Promise(async (resolve, reject) => {
        let resolved = false;
		try {
			await handler(test, () => {
                resolve();
                app.stop();
            });
		} catch (e) {
            reject(e);
            app.stop();
            throw e;
		}
	})
}
