
export const CONTROLLER_CLASSES = [];

export function Controller(basePath? : string) {
	return function(target) {
		
		// Add our parameters in as keys of the main metadata 
		// item

		Reflect.defineMetadata("alterior:Controller", {
			basePath: basePath
		}, target);

		// Add the controller to the global registry
		
		CONTROLLER_CLASSES.push(target);
	}
}