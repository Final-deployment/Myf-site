/**
 * Error Types for the Application
 * 
 * Centralized error type definitions to replace `any` types
 * throughout the codebase for better type safety.
 * 
 * @module types/errors
 */

/**
 * Authentication error thrown when login fails due to verification requirement
 */
export interface AuthVerificationError {
    needsVerification: boolean;
    email?: string;
    messageAr?: string;
    message?: string;
}

/**
 * Generic API error response
 */
export interface ApiError {
    message: string;
    messageAr?: string;
    code?: string;
    status?: number;
}

/**
 * Registration error response
 */
export interface RegistrationError {
    message: string;
    field?: string;
    messageAr?: string;
}

/**
 * Registration request data
 */
export interface RegistrationData {
    email: string;
    password: string;
    name: string;
    nameEn?: string;
    whatsapp?: string;
    country?: string;
    age?: number;
    gender?: string;
    educationLevel?: string;
}

/**
 * Type guard to check if an error is an AuthVerificationError
 */
export function isAuthVerificationError(error: unknown): error is AuthVerificationError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'needsVerification' in error &&
        (error as AuthVerificationError).needsVerification === true
    );
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as ApiError).message === 'string'
    );
}
