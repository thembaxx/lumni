export type ServiceResult<T> =
	| { success: true; data: T }
	| { success: false; error: string };

export function success<T>(data: T): ServiceResult<T> {
	return { success: true, data };
}

export function failure<T = never>(error: string): ServiceResult<T> {
	return { success: false, error };
}
