import { clsx } from "clsx";

export type DefaultBreakpoints = "sm" | "md" | "lg" | "xl";
export type Breakpoints = DefaultBreakpoints;

export type BreakpointsMap<V, B extends string = DefaultBreakpoints> = {
	initial: V;
} & Partial<{
	[breakpoint in B]: V;
}>;

export type ResponsiveValue<T, B extends string = DefaultBreakpoints> =
	| T
	| BreakpointsMap<T, B>;

const isSingularValue = <A, B extends string>(
	value: ResponsiveValue<A, B>,
): value is A => !isBreakpointsMap(value);

const isBreakpointsMap = <A, B extends string>(
	value: ResponsiveValue<A, B>,
): value is BreakpointsMap<A, B> =>
	typeof value === "object" && value != null && !Array.isArray(value);

/**
 * Maps a ResponsiveValue to a new ResponsiveValue using the provided mapper function. Singular values are passed through as is.
 *
 * @template V The type of the original value
 * @template T The type of the mapped value
 * @template B The type of breakpoints
 * @param {ResponsiveValue<V, B>} value - The original ResponsiveValue to be mapped
 * @param {function(V): T} mapper - A function that maps a ResponsiveValue to a new ResponsiveValue
 * @returns {ResponsiveValue<T, B>} A new ResponsiveValue with the mapped values
 *
 *
 * @example
 * const sizes = {
 *  initial: 'md',
 *  sm: 'lg',
 * }
 *
 * const output = mapResponsiveValue(sizes, size => {
 *	switch (size) {
 *		case 'initial':
 *		return 'sm';
 *		case 'sm':
 *			return 'md';
 *		}
 *	});
 *
 * // console.log(output)
 * {
 *	initial: 'sm',
 *	sm: 'md',
 * }
 */
export const mapResponsiveValue = <V, T, B extends string = DefaultBreakpoints>(
	value: ResponsiveValue<V, B>,
	mapper: (value: V) => T,
): ResponsiveValue<T, B> =>
	isSingularValue(value)
		? mapper(value)
		: (Object.fromEntries(
				Object.entries(value).map(([breakpoint, value]) => [
					breakpoint,
					mapper(value),
				]),
			) as BreakpointsMap<T, B>);

/**
 * Start of rcv and types
 */

type VariantValue = Record<string, string>;
type VariantConfig = Record<string, VariantValue>;

type StringBoolean = "true" | "false";
type BooleanVariant = Partial<Record<StringBoolean, string>>;

type VariantPropValue<T, B extends string> = T extends BooleanVariant
	? ResponsiveValue<boolean, B> | undefined
	: T extends Record<string, unknown>
		? ResponsiveValue<keyof T, B>
		: never;

type VariantProps<T extends VariantConfig, B extends string> = {
	[K in keyof T]: VariantPropValue<T[K], B>;
} & {
	className?: string;
};

type ResponsiveClassesConfig<T extends VariantConfig, B extends string> = {
	base: string;
	variants?: T;
	compoundVariants?: Partial<VariantProps<T, B>>[];
	onComplete?: (classes: string) => void;
};

/**
 * Creates a function that generates classes based on variant configurations and responsive props
 *
 * @template T - Type extending VariantConfig (Record of variant names to their possible values and corresponding classes)
 * @template B - The breakpoints type
 *
 * @param config - Configuration object for variants
 * @param config.base - Base classes that are always applied
 * @param config.variants - Object containing variant definitions where each key is a variant name
 *                         and value is either a string of class names, an object mapping variant values to class names,
 *                         or an object with true/false keys for boolean variants
 * @param config.compoundVariants - Optional array of compound variants that apply additional classes
 *                                 when multiple variants have specific values
 * @param config.onComplete - Optional callback function that receives the generated classes
 *
 * @returns A function that accepts variant props and returns classes with twMerge
 *
 * @example
 * const getButtonVariants = rcv({
 *   base: "px-4 py-2 rounded",
 *   variants: {
 *     intent: {
 *       primary: "bg-blue-500 text-white",
 *       secondary: "bg-gray-200 text-gray-800"
 *     },
 *     size: {
 *       sm: "text-sm",
 *       lg: "text-lg"
 *     },
 *     disabled: {
 *       true: "opacity-50 cursor-not-allowed"
 *     }
 *   }
 * });
 *
 * // Usage:
 * getButtonVariants({ intent: "primary", size: "lg", disabled: true })
 * // Or with responsive values:
 * getButtonVariants({ intent: { initial: "primary", md: "secondary" } })
 */
export const rcv =
	<T extends VariantConfig, B extends string = DefaultBreakpoints>({
		base,
		variants,
		compoundVariants,
		onComplete,
	}: ResponsiveClassesConfig<T, B>) =>
	({ className, ...props }: VariantProps<T, B>) => {
		const responsiveClasses = Object.entries(props)
			.map(([key, propValue]: [keyof T, VariantPropValue<T[keyof T], B>]) => {
				const variant = variants?.[key];
				const value =
					typeof propValue === "boolean" ? String(propValue) : propValue;

				// Handle undefined values
				if (!value) return undefined;

				const variantValue = variant?.[value as keyof VariantValue];

				// Handle string values
				if (typeof variantValue === "string") {
					return variantValue;
				}

				// Handle responsive values
				return Object.entries(value as Partial<BreakpointsMap<T, B>>)
					.map(([breakpoint, value]) => {
						// If the breakpoint is initial, return the variant value without breakpoint prefix
						if (breakpoint === "initial") {
							return variants?.[key]?.[value as keyof typeof variant];
						}
						// Otherwise, return the variant value with the breakpoint prefix
						return variants?.[key]?.[value as keyof typeof variant]
							?.split(" ")
							.map((className) => `${breakpoint}:${className}`)
							.join(" ");
					})
					.join(" ");
			})
			.filter(Boolean)
			.join(" ");

		const compoundClasses = compoundVariants
			?.map(({ className, ...compound }) => {
				if (
					Object.entries(compound).every(
						([key, value]) =>
							props[key] === String(value) || props[key] === value,
					)
				) {
					return className;
				}
				return undefined;
			})
			.filter(Boolean);

		const classes = clsx(base, responsiveClasses, compoundClasses, className);
		return onComplete ? onComplete(classes) : classes;
	};

/**
 * Creates a custom rcv function with custom breakpoints and an optional onComplete callback
 *
 * @template B - The custom breakpoints type
 * @param breakpoints - Array of custom breakpoint names
 * @param onComplete - Optional callback function that receives the generated classes
 * @returns A function that creates rcv with custom breakpoints
 *
 * @example
 * const customRcv = createRcv(['mobile', 'tablet', 'desktop']);
 *
 * const getButtonVariants = customRcv({
 *   base: "px-4 py-2 rounded",
 *   variants: {
 *     intent: {
 *       primary: "bg-blue-500 text-white",
 *       secondary: "bg-gray-200 text-gray-800"
 *     }
 *   }
 * });
 *
 * // Usage with custom breakpoints:
 * getButtonVariants({ intent: { initial: "primary", mobile: "secondary", desktop: "primary" } })
 */

export const createRcv = <B extends string>(
	_breakpoints: readonly B[],
	onComplete?: (classes: string) => void,
) => {
	return <T extends VariantConfig>(config: ResponsiveClassesConfig<T, B>) =>
		rcv<T, B>({ ...config, onComplete });
};
