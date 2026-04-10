import { clsx } from "clsx";
import {
	createSlotFunction,
	isSlotsConfig,
	matchesCompoundVariant,
	processVariantProps,
} from "./helpers";
import type {
	CompoundVariantWithSlots,
	DefaultBreakpoints,
	ResponsiveClassesConfig,
	SlotConfig,
	VariantConfig,
	VariantProps,
	VariantValue,
} from "./types";

/**
 * Builds responsive class strings from a config object.
 *
 * Pass **`breakpoints`** as a `const` tuple (e.g. `['mobile', 'tablet'] as const`) only when you want
 * TypeScript to infer custom breakpoint names for responsive props. It is not read at runtime.
 * Omit it to use the default `sm` / `md` / `lg` / `xl` breakpoints.
 */
// Function overloads for rcv
export function rcv<
	T extends VariantConfig = Record<never, VariantValue>,
	S extends Record<string, SlotConfig> = Record<string, SlotConfig>,
	B extends string = DefaultBreakpoints,
>(config: {
	slots: S;
	variants?: T;
	compoundVariants?: CompoundVariantWithSlots<T, keyof S & string, B>[];
	breakpoints?: readonly B[];
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
	breakpoints?: readonly B[];
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
				breakpoints?: readonly B[];
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
 * Returns an `rcv` that uses custom breakpoint names for typing.
 *
 * The first argument is **type-only** (not read at runtime): it lets TypeScript infer `B`.
 * You can get the same effect with {@link rcv} by passing `breakpoints: ['mobile', 'tablet'] as const` on the config object.
 *
 * @template B - The custom breakpoints type
 * @param breakpoints - Optional tuple of custom breakpoint names (for inference only)
 * @param onComplete - Optional callback applied to the merged class string
 * @returns An `rcv` function whose props use `B` for responsive keys
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
		breakpoints?: readonly B[];
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
		breakpoints?: readonly B[];
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
					breakpoints?: readonly B[];
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
