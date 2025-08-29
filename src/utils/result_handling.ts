import { error } from "console";
import { EventPlan } from "../models/agenda_models";

export enum ErrorType { error, warning }
export enum ErrorCategory { MissingInformation, TimingError, ParsingError }

export function createResult({ isSuccess, eventPlan = null, error = null }): Result {
    const newResult = new Result(isSuccess);
    newResult.eventPlan = eventPlan;
    if (error != null) {
        newResult.error = error.message;
    }
    return newResult;
}

export class Result {
    isSuccess: boolean;
    eventPlan?: EventPlan;
    error?: CustomError;

    constructor(isSuccess: boolean) {
        this.isSuccess = isSuccess;

    }
}

export class CustomError implements Error {
    name: string;
    message: string;
    stack?: string;
    cause?: Error;

    errorType: string;

    constructor(name: ErrorCategory, message: string, errorType: ErrorType, cause?: Error) {
        this.name = ErrorCategory[name];
        this.message = message;
        this.errorType = ErrorType[errorType];
        this.cause = cause;
    }
}