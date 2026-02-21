import { clsx } from "clsx";
import {
	createSlotFunction,
	isSlotsConfig,
	matchesCompoundVariant,
	processVariantProps,
} from "./helpers.js";
import type {
	CompoundVariantWithSlots,
	DefaultBreakpoints,
	ResponsiveClassesConfig,
	SlotConfig,
	VariantConfig,
	VariantProps,
	VariantValue,
} from "./types.js";

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
		{
			className,
			class: classFromProps,
			...props
		}: VariantProps<T, B> = {} as VariantProps<T, B>,
	) => {
		const responsiveClasses = processVariantProps(props, variants);

		const compoundClasses = compoundVariants?.map(
			({ className: compoundClassName, ...compound }) => {
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
			},
		);

		const classes = clsx(
			base,
			responsiveClasses,
			compoundClasses,
			className,
			classFromProps,
		);
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

	function customRcv<
		T extends VariantConfig = Record<never, VariantValue>,
	>(config: {
		base: string;
		variants?: T;
		compoundVariants?: Partial<VariantProps<T, B>>[];
		onComplete?: (classes: string) => string;
	}): (props?: VariantProps<T, B>) => string;

	function customRcv<
		T extends VariantConfig = Record<never, VariantValue>,
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
