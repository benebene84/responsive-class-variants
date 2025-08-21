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

type VariantValue = Record<string, string | Record<string, string>>;
type VariantConfig = Record<string, VariantValue>;

type StringBoolean = "true" | "false";
type BooleanVariant = Partial<
	Record<StringBoolean, string | Record<string, string>>
>;

type VariantPropValue<T, B extends string> = T extends BooleanVariant
	? ResponsiveValue<boolean, B> | undefined
	: T extends Record<string, unknown>
		? ResponsiveValue<keyof T, B>
		: never;

type VariantProps<T extends VariantConfig, B extends string> = {
	[K in keyof T]?: VariantPropValue<T[K], B>;
} & {
	className?: string;
};

// Slot configuration types
type SlotConfig = string;

type SlotsConfig<S extends string> = Record<S, SlotConfig>;

type CompoundVariantWithSlots<
	T extends VariantConfig,
	S extends string,
	B extends string,
> = Partial<VariantProps<T, B>> & {
	class?: Partial<Record<S, string>>;
	className?: string;
};

type ResponsiveClassesConfig<T extends VariantConfig, B extends string> =
	| {
			base: string;
			variants?: T;
			compoundVariants?: Partial<VariantProps<T, B>>[];
			onComplete?: (classes: string) => string;
	  }
	| {
			slots: SlotsConfig<string>;
			variants?: T;
			compoundVariants?: CompoundVariantWithSlots<T, string, B>[];
			onComplete?: (classes: string) => string;
	  };

// Helper functions for slots
const isSlotsConfig = <T extends VariantConfig, B extends string>(
	config: ResponsiveClassesConfig<T, B>,
): config is {
	slots: SlotsConfig<string>;
	variants?: T;
	compoundVariants?: CompoundVariantWithSlots<T, string, B>[];
	onComplete?: (classes: string) => string;
} => {
	return "slots" in config;
};

const createSlotFunction =
	<T extends VariantConfig, B extends string>(
		slotConfig: SlotConfig,
		variants: T | undefined,
		compoundVariants: CompoundVariantWithSlots<T, string, B>[] | undefined,
		onComplete: ((classes: string) => string) | undefined,
		slotName: string,
	): ((props?: VariantProps<T, B>) => string) =>
	({ className, ...props }: VariantProps<T, B> = {} as VariantProps<T, B>) => {
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

				// Handle object values (slot-specific classes)
				if (
					typeof variantValue === "object" &&
					variantValue !== null &&
					slotName in variantValue
				) {
					const slotSpecificValue = variantValue[slotName];
					if (typeof slotSpecificValue === "string") {
						return slotSpecificValue;
					}
				}

				// Handle responsive values
				return Object.entries(value as Partial<BreakpointsMap<T, B>>)
					.map(([breakpoint, value]) => {
						// If the breakpoint is initial, return the variant value without breakpoint prefix
						if (breakpoint === "initial") {
							const initialVariantValue =
								variants?.[key]?.[value as keyof typeof variant];
							if (typeof initialVariantValue === "string") {
								return initialVariantValue;
							}
							if (
								typeof initialVariantValue === "object" &&
								initialVariantValue !== null &&
								slotName in initialVariantValue
							) {
								return initialVariantValue[slotName];
							}
							return undefined;
						}
						// Otherwise, return the variant value with the breakpoint prefix
						const breakpointVariantValue =
							variants?.[key]?.[value as keyof typeof variant];
						if (typeof breakpointVariantValue === "string") {
							return breakpointVariantValue
								.split(" ")
								.map((className: string) => `${breakpoint}:${className}`)
								.join(" ");
						}
						if (
							typeof breakpointVariantValue === "object" &&
							breakpointVariantValue !== null &&
							slotName in breakpointVariantValue
						) {
							const slotValue = breakpointVariantValue[slotName];
							if (typeof slotValue === "string") {
								return slotValue
									.split(" ")
									.map((className: string) => `${breakpoint}:${className}`)
									.join(" ");
							}
						}
						return undefined;
					})
					.filter(Boolean)
					.join(" ");
			})
			.filter(Boolean)
			.join(" ");

		const compoundClasses = compoundVariants
			?.map(
				({ class: slotClasses, className: compoundClassName, ...compound }) => {
					if (
						Object.entries(compound).every(
							([key, value]) =>
								props[key] === String(value) || props[key] === value,
						)
					) {
						// If compound variant has slot-specific classes, use those for this slot
						if (
							slotClasses &&
							typeof slotClasses === "object" &&
							slotClasses[slotName]
						) {
							return slotClasses[slotName];
						}
						// Otherwise use the general className
						return compoundClassName;
					}
					return undefined;
				},
			)
			.filter(Boolean);

		const classes = clsx(
			slotConfig,
			responsiveClasses,
			compoundClasses,
			className,
		);
		return onComplete ? onComplete(classes) : classes;
	};

// Function overloads for rcv
export function rcv<
	T extends VariantConfig,
	B extends string = DefaultBreakpoints,
>(config: {
	slots: SlotsConfig<string>;
	variants?: T;
	compoundVariants?: CompoundVariantWithSlots<T, string, B>[];
	onComplete?: (classes: string) => string;
}): {
	[K in keyof typeof config.slots]: (props?: VariantProps<T, B>) => string;
};

export function rcv<
	T extends VariantConfig,
	B extends string = DefaultBreakpoints,
>(config: {
	base: string;
	variants?: T;
	compoundVariants?: Partial<VariantProps<T, B>>[];
	onComplete?: (classes: string) => string;
}): (props: VariantProps<T, B>) => string;

export function rcv<
	T extends VariantConfig,
	B extends string = DefaultBreakpoints,
>(config: ResponsiveClassesConfig<T, B>) {
	if (isSlotsConfig(config)) {
		const { slots, variants, compoundVariants, onComplete } = config;
		const slotFunctions: Record<string, (props: VariantProps<T, B>) => string> =
			{};

		for (const [slotName, slotConfig] of Object.entries(slots)) {
			slotFunctions[slotName] = createSlotFunction<T, B>(
				slotConfig,
				variants,
				compoundVariants,
				onComplete,
				slotName,
			);
		}

		return slotFunctions as {
			[K in keyof typeof slots]: (props?: VariantProps<T, B>) => string;
		};
	}

	const { base, variants, compoundVariants, onComplete } = config;
	return ({ className, ...props }: VariantProps<T, B>) => {
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
						const breakpointVariantValue =
							variants?.[key]?.[value as keyof typeof variant];
						if (typeof breakpointVariantValue === "string") {
							return breakpointVariantValue
								.split(" ")
								.map((className: string) => `${breakpoint}:${className}`)
								.join(" ");
						}
						return undefined;
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
}

/**
 * Creates a custom rcv function with custom breakpoints and an optional onComplete callback
 *
 * @template B - The custom breakpoints type
 * @param breakpoints - Optional array of custom breakpoint names
 * @param onComplete - Optional callback function that receives the generated classes and returns the final classes
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
	_breakpoints?: readonly B[],
	onComplete?: (classes: string) => string,
) => {
	function customRcv<T extends VariantConfig>(config: {
		slots: SlotsConfig<string>;
		variants?: T;
		compoundVariants?: CompoundVariantWithSlots<T, string, B>[];
		onComplete?: (classes: string) => string;
	}): {
		[K in keyof typeof config.slots]: (props?: VariantProps<T, B>) => string;
	};

	function customRcv<T extends VariantConfig>(config: {
		base: string;
		variants?: T;
		compoundVariants?: Partial<VariantProps<T, B>>[];
		onComplete?: (classes: string) => string;
	}): (props: VariantProps<T, B>) => string;

	function customRcv<T extends VariantConfig>(
		config: ResponsiveClassesConfig<T, B>,
	) {
		if (isSlotsConfig(config)) {
			return rcv<T, B>({
				...config,
				onComplete: onComplete || config.onComplete,
			});
		} else {
			return rcv<T, B>({
				...config,
				onComplete: onComplete || config.onComplete,
			});
		}
	}

	return customRcv;
};
