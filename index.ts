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

type ClassValue = string | ReadonlyArray<string>;

type ValueType = ClassValue | Record<string, ClassValue>;

type VariantValue = Record<string, ValueType>;
type VariantConfig = Record<string, VariantValue>;

type StringBoolean = "true" | "false";
type BooleanVariant = Partial<
	Record<StringBoolean, ClassValue | Record<string, ClassValue>>
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
type SlotConfig = ClassValue;

type SlotsConfig<S extends Record<string, SlotConfig>> = S;

type CompoundVariantWithSlots<
	T extends VariantConfig,
	S extends string,
	B extends string,
> = Partial<VariantProps<T, B>> & {
	class?: Partial<Record<S, ClassValue>>;
	className?: string;
};

type ResponsiveClassesConfigBase<T extends VariantConfig, B extends string> = {
	base: string;
	variants?: T;
	compoundVariants?: Partial<VariantProps<T, B>>[];
	onComplete?: (classes: string) => string;
};

type ResponsiveClassesConfigSlots<
	T extends VariantConfig,
	S extends Record<string, SlotConfig>,
	B extends string,
> = {
	slots: SlotsConfig<S>;
	variants?: T;
	compoundVariants?: CompoundVariantWithSlots<T, keyof S & string, B>[];
	onComplete?: (classes: string) => string;
};

type ResponsiveClassesConfig<T extends VariantConfig, B extends string> =
	| ResponsiveClassesConfigBase<T, B>
	| ResponsiveClassesConfigSlots<T, Record<string, SlotConfig>, B>;

// Helper functions for slots
const isSlotsConfig = <T extends VariantConfig, B extends string>(
	config: ResponsiveClassesConfig<T, B>,
): config is ResponsiveClassesConfigSlots<T, Record<string, SlotConfig>, B> => {
	return "slots" in config;
};

const normalizeClassValue = (value: ClassValue | undefined) => {
	if (Array.isArray(value)) {
		return value.join(" ");
	}
	if (typeof value === "string") {
		return value;
	}
	return undefined;
};

const prefixClasses = (classes: string, prefix: string) =>
	classes
		.split(" ")
		.map((className) => `${prefix}:${className}`)
		.join(" ");

// Helper function to get variant value for a specific slot or base
const getVariantValue = <T extends VariantConfig>(
	variants: T | undefined,
	key: keyof T,
	value: string,
	slotName?: string,
): string | undefined => {
	const variant = variants?.[key];
	const variantValue = variant?.[value];

	if (typeof variantValue === "string" || Array.isArray(variantValue)) {
		return normalizeClassValue(variantValue);
	}

	if (
		typeof variantValue === "object" &&
		variantValue !== null &&
		slotName &&
		slotName in variantValue
	) {
		const slotSpecificValue = (variantValue as Record<string, ClassValue>)[
			slotName
		];
		return normalizeClassValue(slotSpecificValue);
	}

	return undefined;
};

// Helper function to process responsive values
const processResponsiveValue = <T extends VariantConfig, B extends string>(
	variants: T | undefined,
	key: keyof T,
	value: Partial<BreakpointsMap<T, B>>,
	slotName?: string,
) => {
	return Object.entries(value)
		.map(([breakpoint, breakpointValue]) => {
			const variantValue = getVariantValue(
				variants,
				key,
				breakpointValue as string,
				slotName,
			);

			if (!variantValue) return undefined;

			// If the breakpoint is initial, return without prefix
			if (breakpoint === "initial") {
				return variantValue;
			}

			// Otherwise, return with breakpoint prefix
			return prefixClasses(variantValue, breakpoint);
		})
		.filter(Boolean)
		.join(" ");
};

// Helper function to process variant props into classes
const processVariantProps = <T extends VariantConfig, B extends string>(
	props: Omit<VariantProps<T, B>, "className">,
	variants: T | undefined,
	slotName?: string,
) => {
	return Object.entries(props)
		.map(([key, propValue]: [keyof T, VariantPropValue<T[keyof T], B>]) => {
			const value =
				typeof propValue === "boolean" ? String(propValue) : propValue;

			// Handle undefined values
			if (!value) return undefined;

			// Handle singular values
			if (typeof value === "string") {
				return getVariantValue(variants, key, value, slotName);
			}

			// Handle responsive values
			return processResponsiveValue(
				variants,
				key,
				value as Partial<BreakpointsMap<T, B>>,
				slotName,
			);
		})
		.filter(Boolean)
		.join(" ");
};

// Helper function to match compound variants
const matchesCompoundVariant = <T extends VariantConfig, B extends string>(
	compound: Omit<CompoundVariantWithSlots<T, string, B>, "className" | "class">,
	props: Omit<VariantProps<T, B>, "className">,
) => {
	return Object.entries(compound).every(
		([key, value]) =>
			props[key as keyof typeof props] === String(value) ||
			props[key as keyof typeof props] === value,
	);
};

const createSlotFunction =
	<T extends VariantConfig, B extends string>(
		slotConfig: SlotConfig,
		variants: T | undefined,
		compoundVariants: CompoundVariantWithSlots<T, string, B>[] | undefined,
		onComplete: ((classes: string) => string) | undefined,
		slotName: string,
	) =>
	({ className, ...props }: VariantProps<T, B> = {} as VariantProps<T, B>) => {
		const responsiveClasses = processVariantProps(props, variants, slotName);

		const compoundClasses = compoundVariants
			?.map(
				({ class: slotClasses, className: compoundClassName, ...compound }) => {
					if (matchesCompoundVariant(compound, props)) {
						// If compound variant has slot-specific classes, use those for this slot
						if (
							slotClasses &&
							typeof slotClasses === "object" &&
							slotClasses[slotName]
						) {
							return normalizeClassValue(slotClasses[slotName]);
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
	T extends VariantConfig = Record<never, VariantValue>,
	S extends Record<string, SlotConfig> = Record<string, SlotConfig>,
	B extends string = DefaultBreakpoints,
>(config: {
	slots: S;
	variants?: T;
	compoundVariants?: CompoundVariantWithSlots<T, keyof S & string, B>[];
	onComplete?: (classes: string) => string;
}): () => {
	[K in keyof S]: (props?: VariantProps<T, B>) => string;
};

export function rcv<
	T extends VariantConfig = Record<never, VariantValue>,
	B extends string = DefaultBreakpoints,
>(config: {
	base: string;
	variants?: T;
	compoundVariants?: Partial<VariantProps<T, B>>[];
	onComplete?: (classes: string) => string;
}): (props?: VariantProps<T, B>) => string;

export function rcv<
	T extends VariantConfig = Record<never, VariantValue>,
	S extends Record<string, SlotConfig> = Record<string, SlotConfig>,
	B extends string = DefaultBreakpoints,
>(
	config:
		| ResponsiveClassesConfig<T, B>
		| {
				slots: S;
				variants?: T;
				compoundVariants?: CompoundVariantWithSlots<T, keyof S & string, B>[];
				onComplete?: (classes: string) => string;
		  },
) {
	// Check if config is a slots config
	if (isSlotsConfig(config)) {
		const { slots, variants, compoundVariants, onComplete } = config;
		return () => {
			const slotFunctions = {} as {
				[K in keyof S]: (props?: VariantProps<T, B>) => string;
			};

			// Create slot functions for each slot - ensure all slots are always present
			for (const [slotName, slotConfig] of Object.entries(slots)) {
				const slotFunction = createSlotFunction<T, B>(
					slotConfig,
					variants,
					compoundVariants,
					onComplete,
					slotName,
				);

				slotFunctions[slotName as keyof S] = slotFunction;
			}

			return slotFunctions;
		};
	}

	// If config is not a slots config, create a base function
	const { base, variants, compoundVariants, onComplete } = config;
	return (
		{ className, ...props }: VariantProps<T, B> = {} as VariantProps<T, B>,
	) => {
		const responsiveClasses = processVariantProps(props, variants);

		const compoundClasses = compoundVariants
			?.map(({ className: compoundClassName, ...compound }) => {
				if (
					matchesCompoundVariant(
						compound as Omit<
							CompoundVariantWithSlots<T, string, B>,
							"className" | "class"
						>,
						props,
					)
				) {
					return compoundClassName;
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
	function customRcv<
		T extends VariantConfig = Record<never, VariantValue>,
		S extends Record<string, SlotConfig> = Record<string, SlotConfig>,
	>(config: {
		slots: S;
		variants?: T;
		compoundVariants?: CompoundVariantWithSlots<T, keyof S & string, B>[];
		onComplete?: (classes: string) => string;
	}): () => {
		[K in keyof S]: (props?: VariantProps<T, B>) => string;
	};

	function customRcv<T extends VariantConfig>(config: {
		base: string;
		variants?: T;
		compoundVariants?: Partial<VariantProps<T, B>>[];
		onComplete?: (classes: string) => string;
	}): (props?: VariantProps<T, B>) => string;

	function customRcv<
		T extends VariantConfig,
		S extends Record<string, SlotConfig> = Record<string, SlotConfig>,
	>(
		config:
			| ResponsiveClassesConfig<T, B>
			| {
					slots: S;
					variants?: T;
					compoundVariants?: CompoundVariantWithSlots<T, keyof S & string, B>[];
					onComplete?: (classes: string) => string;
			  },
	) {
		if (isSlotsConfig(config)) {
			return rcv<T, S, B>({
				...config,
				onComplete: onComplete || config.onComplete,
			} as {
				slots: S;
				variants?: T;
				compoundVariants?: CompoundVariantWithSlots<T, keyof S & string, B>[];
				onComplete?: (classes: string) => string;
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
