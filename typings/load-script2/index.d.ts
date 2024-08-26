declare module 'load-script2' {
    const loadScript: (src: string, callback: (err: Error, script: HTMLScriptElement) => void) => void
    export default loadScript;
}
