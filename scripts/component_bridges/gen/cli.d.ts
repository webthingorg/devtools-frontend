import { GeneratedCode } from './generate_closure.js';
export declare const writeToDisk: (inputFilePath: string, generatedCode: GeneratedCode) => {
    output: string;
    code: string;
};
interface Options {
    forceRewriting: boolean;
    silenceOutput: boolean;
}
export declare const parseTypeScriptComponent: (componentSourceFilePath: string, options?: Options) => {
    output: string;
    code: string;
} | {
    output: undefined;
    code: undefined;
};
export declare const main: (args: string[]) => string | undefined;
export {};
