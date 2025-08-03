import { error } from "console";

export enum ErrorType { error, warning }
export enum ErrorCategory { MissingInformation, TimingError, ParsingError }

export class CustomError implements Error {
    name: string;
    message: string;
    stack?: string;
    cause?: Error;

    errorType: ErrorType;

    constructor(name: ErrorCategory, message: string, errorType: ErrorType, cause?: Error) {
        this.name = name.toString();
        this.message = message;
        this.errorType = errorType;
        this.cause = cause;
    }
}