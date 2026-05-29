import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales } from "./locales";

const messageLoaders: Record<
	string,
	() => Promise<{ default: Record<string, unknown> }>
> = {
	en: () => import("../../messages/en.json"),
	af: () => import("../../messages/af.json"),
	zu: () => import("../../messages/zu.json"),
	xh: () => import("../../messages/xh.json"),
	st: () => import("../../messages/st.json"),
	tn: () => import("../../messages/tn.json"),
	nso: () => import("../../messages/nso.json"),
	ts: () => import("../../messages/ts.json"),
	ss: () => import("../../messages/ss.json"),
	ve: () => import("../../messages/ve.json"),
	nd: () => import("../../messages/nd.json"),
};

export default getRequestConfig(async ({ requestLocale }) => {
	const requested = await requestLocale;
	const locale = hasLocale(locales, requested) ? requested : defaultLocale;
	const loader = messageLoaders[locale] ?? messageLoaders.en;

	return {
		locale,
		messages: (await loader()).default,
	};
});
