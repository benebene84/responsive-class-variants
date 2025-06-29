import { clsx } from "clsx";

export type Breakpoints = "sm" | "md" | "lg" | "xl";

export type BreakpointsMap<V> = {
	initial: V;
} & Partial<{
	[breakpoint in Breakpoints]: V;
}>;

export type ResponsiveValue<T> = T | BreakpointsMap<T>;

const isSingularValue = <A>(value: ResponsiveValue<A>): value is A =>
	!isBreakpointsMap(value);

const isBreakpointsMap = <A>(
	value: ResponsiveValue<A>,
): value is BreakpointsMap<A> =>
	typeof value === "object" && value != null && !Array.isArray(value);

/**
 * Maps a ResponsiveValue to a new ResponsiveValue using the provided mapper function. Singular values are passed through as is.
 *
 * @template V The type of the original value
 * @template T The type of the mapped value
 * @param {ResponsiveValue<V>} value - The original ResponsiveValue to be mapped
 * @param {function(V): T} mapper - A function that maps a ResponsiveValue to a new ResponsiveValue
 * @returns {ResponsiveValue<T>} A new ResponsiveValue with the mapped values
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
export const mapResponsiveValue = <V, T>(
	value: ResponsiveValue<V>,
	mapper: (value: V) => T,
): ResponsiveValue<T> =>
	isSingularValue(value)
		? mapper(value)
		: (Object.fromEntries(
				Object.entries(value).map(([breakpoint, value]) => [
					breakpoint,
					mapper(value),
				]),
			) as BreakpointsMap<T>);

type VariantValue = Record<string, string>;
type VariantConfig = Record<string, VariantValue>;

type StringBoolean = "true" | "false";
type BooleanVariant = Partial<Record<StringBoolean, string>>;

type VariantPropValue<T> = T extends BooleanVariant
	? ResponsiveValue<boolean> | undefined
	: T extends Record<string, unknown>
		? ResponsiveValue<keyof T>
		: never;

type VariantProps<T extends VariantConfig> = {
	[K in keyof T]: VariantPropValue<T[K]>;
} & {
	className?: string;
};

type ResponsiveClassesConfig<T extends VariantConfig> = {
	base: string;
	variants?: T;
	compoundVariants?: Partial<VariantProps<T>>[];
};

/**
 * Creates a function that generates classes based on variant configurations and responsive props
 *
 * @template T - Type extending VariantConfig (Record of variant names to their possible values and corresponding classes)
 *
 * @param config - Configuration object for variants
 * @param config.base - Base classes that are always applied
 * @param config.variants - Object containing variant definitions where each key is a variant name
 *                         and value is either a string of class names, an object mapping variant values to class names,
 *                         or an object with true/false keys for boolean variants
 * @param config.compoundVariants - Optional array of compound variants that apply additional classes
 *                                 when multiple variants have specific values
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
	<T extends VariantConfig>({
		base,
		variants,
		compoundVariants,
	}: ResponsiveClassesConfig<T>) =>
	({ className, ...props }: VariantProps<T>) => {
		const responsiveClasses = Object.entries(props)
			.map(([key, propValue]: [keyof T, VariantPropValue<T[keyof T]>]) => {
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
				return Object.entries(value as Partial<BreakpointsMap<T>>)
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

		return clsx(base, responsiveClasses, compoundClasses, className);
	};
