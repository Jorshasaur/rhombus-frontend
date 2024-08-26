import * as InvisionLogger from '@invisionapp/invision-nodejs-logger'

/**
 * The Logger class is just currently a Typescript friendly wrapper for the 
 * InvisionLogger.  It also makes it easier to stub for unit testing.
 * 
 * If you want to shut up individual logs, using sinon just stub out the prototype methods:
 *      sinon.stub(Logger.prototype, "error")    
 * 
 */
export class Logger {

    logger:any

    /**
     * The constructor builds the InvisionLogger file context, 
     * it takes one param which is the resolved filename.  You should include
     * that so the file name prints nicely in Loggly
     * @param filename You should almost always pass in __filename
     */
    constructor(filename:any) {
        this.logger = InvisionLogger.forFile(filename); 
    }

    /**
     * When things break!
     * @param arguments 
     */
    public error(...args:any[]) {
        this.logger.error(args.join(' '))
    }

    /**
     * Prints debug info.  Keep in mind that debug logs are still visible in loggly.  
     * Be careful not to log any PMI with this method because it will be saved.
     * @param arguments
     */
    public debug(...args:any[]) {
        this.logger.debug(args.join(' '))
    }

    /**
     * Just like error but this represents a failure that stops the service
     * @param args 
     */
    public fatal(...args:any[]) {
        this.logger.fatal(args.join(' '))
    }

}