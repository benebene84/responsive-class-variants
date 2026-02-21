import { clsx } from "clsx";
import type {
	BreakpointsMap,
	CompoundVariantClassValue,
	CompoundVariantWithSlots,
	DefaultBreakpoints,
	ResponsiveClassesConfig,
	ResponsiveClassesConfigSlots,
	ResponsiveValue,
	SlotConfig,
	VariantConfig,
	VariantProps,
	VariantPropValue,
} from "./types.js";

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
): ResponsiveValue<T, B> => {
	if (isSingularValue(value)) {
		return mapper(value);
	}

	const result: Record<string, T> = {};
	for (const key of Object.keys(value)) {
		result[key] = mapper(value[key as keyof typeof value] as V);
	}
	return result as BreakpointsMap<T, B>;
};

// Helper functions for slots
export const isSlotsConfig = <T extends VariantConfig, B extends string>(
	config: ResponsiveClassesConfig<T, B>,
): config is ResponsiveClassesConfigSlots<T, Record<string, SlotConfig>, B> => {
	return "slots" in config;
};

const normalizeClassValue = (
	value: string | ReadonlyArray<string> | undefined,
) => {
	if (Array.isArray(value)) {
		return value.join(" ");
	}
	if (typeof value === "string") {
		return value;
	}
	return undefined;
};

const prefixClasses = (classes: string, prefix: string) =>
	classes.replace(/(\S+)/g, `${prefix}:$1`);

// Helper function to get variant value for a specific slot or base
const getVariantValue = <T extends VariantConfig>(
	variants: T | undefined,
	key: keyof T,
	value: string,
	slotName?: string,
): string | undefined => {
	const variantValue = variants?.[key]?.[value];

	// Early return if no variant value found
	if (variantValue == null) return undefined;

	// Handle string or array values directly
	if (typeof variantValue === "string" || Array.isArray(variantValue)) {
		return normalizeClassValue(variantValue);
	}

	// Handle slot-specific values (object with slot keys)
	if (slotName && slotName in variantValue) {
		return normalizeClassValue(
			(variantValue as Record<string, string | ReadonlyArray<string>>)[
				slotName
			],
		);
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
	return Object.entries(value).map(([breakpoint, breakpointValue]) => {
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
	});
};

// Helper function to process variant props into classes
export const processVariantProps = <T extends VariantConfig, B extends string>(
	props: Omit<VariantProps<T, B>, "className" | "class">,
	variants: T | undefined,
	slotName?: string,
) => {
	return Object.entries(props).map(
		([key, propValue]: [keyof T, VariantPropValue<T[keyof T], B>]) => {
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
		},
	);
};

// Helper function to match compound variants
export const matchesCompoundVariant = <
	T extends VariantConfig,
	B extends string,
>(
	compound: Omit<CompoundVariantWithSlots<T, string, B>, "className" | "class">,
	props: Omit<VariantProps<T, B>, "className" | "class">,
) => {
	return Object.entries(compound).every(([key, value]) => {
		const propValue = props[key as keyof typeof props];
		// Direct comparison first, then try string conversion for boolean handling
		return propValue === value || propValue === String(value);
	});
};

// Helper function to extract class value from compound variant class prop
const getCompoundVariantSlotClass = <S extends string>(
	classValue: CompoundVariantClassValue<S> | undefined,
	slotName: string,
): string | undefined => {
	if (!classValue) return undefined;

	if (typeof classValue === "object" && classValue[slotName as S]) {
		return normalizeClassValue(classValue[slotName as S]);
	}

	if (typeof classValue === "string") {
		return classValue;
	}

	return undefined;
};

export const createSlotFunction =
	<T extends VariantConfig, B extends string>(
		slotConfig: SlotConfig,
		variants: T | undefined,
		compoundVariants: CompoundVariantWithSlots<T, string, B>[] | undefined,
		onComplete: ((classes: string) => string) | undefined,
		slotName: string,
	) =>
	(
		{
			className,
			class: classFromProps,
			...props
		}: VariantProps<T, B> = {} as VariantProps<T, B>,
	) => {
		const responsiveClasses = processVariantProps(props, variants, slotName);

		const compoundClasses = compoundVariants?.map(
			({
				class: classFromCompound,
				className: classNameFromCompound,
				...compound
			}) => {
				if (matchesCompoundVariant(compound, props)) {
					return [
						getCompoundVariantSlotClass(classFromCompound, slotName),
						getCompoundVariantSlotClass(classNameFromCompound, slotName),
					];
				}
				return undefined;
			},
		);

		const classes = clsx(
			slotConfig,
			responsiveClasses,
			compoundClasses,
			className,
			classFromProps,
		);
		return onComplete ? onComplete(classes) : classes;
	};
