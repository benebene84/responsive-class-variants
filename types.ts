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

type VariantPropsBase<T extends VariantConfig, B extends string> = {
	[K in keyof T]?: VariantPropValue<T[K], B>;
};

type VariantProps<T extends VariantConfig, B extends string> = VariantPropsBase<
	T,
	B
> & {
	className?: string;
	class?: string;
};

// Slot configuration types
type SlotConfig = ClassValue;

type SlotsConfig<S extends Record<string, SlotConfig>> = S;

type CompoundVariantClassValue<S extends string> =
	| string
	| Partial<Record<S, ClassValue>>;

type CompoundVariantWithSlots<
	T extends VariantConfig,
	S extends string,
	B extends string,
> = Partial<Omit<VariantProps<T, B>, "class" | "className">> & {
	class?: CompoundVariantClassValue<S>;
	className?: CompoundVariantClassValue<S>;
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

export type {
	ClassValue,
	CompoundVariantClassValue,
	CompoundVariantWithSlots,
	ResponsiveClassesConfig,
	ResponsiveClassesConfigSlots,
	SlotConfig,
	SlotsConfig,
	VariantConfig,
	VariantProps,
	VariantPropValue,
	VariantValue,
};
