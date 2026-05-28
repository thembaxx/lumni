export type OTPForm = {
	email: string;
	otp: string;
	error: string;
	sent: boolean;
	countdown: number;
	remainingAttempts: number | null;
	verified: boolean;
};

export type OTPAction =
	| { type: "SET_EMAIL"; email: string }
	| { type: "SET_OTP"; otp: string }
	| { type: "SET_ERROR"; error: string }
	| { type: "SET_SENT" }
	| { type: "SET_COUNTDOWN"; countdown: number }
	| { type: "SET_REMAINING_ATTEMPTS"; remainingAttempts: number | null }
	| { type: "SET_VERIFIED" }
	| { type: "TICK" }
	| { type: "RESET" };

export function otpReducer(state: OTPForm, action: OTPAction): OTPForm {
	switch (action.type) {
		case "SET_EMAIL":
			return { ...state, email: action.email };
		case "SET_OTP":
			return { ...state, otp: action.otp };
		case "SET_ERROR":
			return { ...state, error: action.error };
		case "SET_SENT":
			return { ...state, sent: true, countdown: 2 * 60 * 1000 };
		case "SET_COUNTDOWN":
			return { ...state, countdown: action.countdown };
		case "SET_REMAINING_ATTEMPTS":
			return { ...state, remainingAttempts: action.remainingAttempts };
		case "SET_VERIFIED":
			return { ...state, verified: true };
		case "TICK":
			return {
				...state,
				countdown: Math.max(0, state.countdown - 1000),
			};
		case "RESET":
			return {
				email: "",
				otp: "",
				error: "",
				sent: false,
				countdown: 0,
				remainingAttempts: null,
				verified: false,
			};
	}
}

export const initialOTPState: OTPForm = {
	email: "",
	otp: "",
	error: "",
	sent: false,
	countdown: 0,
	remainingAttempts: null,
	verified: false,
};
