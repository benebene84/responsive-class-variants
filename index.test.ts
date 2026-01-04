import { describe, expect, it } from "vitest";
import { createRcv, mapResponsiveValue, rcv } from "./index";

describe("responsive-class-variants", () => {
	// Basic setup with common variants for testing
	const getButtonVariants = rcv({
		base: "rounded px-4 py-2",
		variants: {
			intent: {
				primary: "bg-blue-500 text-white",
				secondary: "bg-gray-200 text-gray-800",
			},
			size: {
				sm: "text-sm",
				lg: "text-lg",
			},
			disabled: {
				true: "cursor-not-allowed opacity-50",
				false: "cursor-pointer",
			},
		},
		compoundVariants: [
			{
				intent: "primary",
				size: "lg",
				disabled: true,
				className: "font-bold",
			},
		],
	});

	it("should apply base classes", () => {
		const result = getButtonVariants({
			intent: "primary",
			size: "lg",
			disabled: false,
		});
		expect(result).toContain("rounded px-4 py-2");
	});

	it("should apply single variant", () => {
		const result = getButtonVariants({
			intent: "primary",
			size: "lg",
			disabled: false,
		});
		expect(result).toContain("bg-blue-500");
		expect(result).toContain("text-white");
	});

	it("should handle boolean variants", () => {
		const result = getButtonVariants({
			intent: "primary",
			size: "lg",
			disabled: true,
		});
		expect(result).toContain("opacity-50");
		expect(result).toContain("cursor-not-allowed");
	});

	it("should pass className when no variants are applied", () => {
		const styles = rcv({
			base: "rounded px-4 py-2",
		});
		const className = "custom-class";
		const result = styles({ className });
		expect(result).toContain("custom-class");
	});

	it("should handle variant values as arrays", () => {
		const styles = rcv({
			base: "rounded px-4 py-2",
			variants: {
				size: {
					sm: ["text-sm", "bg-blue-500"],
					lg: ["text-lg", "bg-gray-200"],
				},
			},
		});
		const result = styles({
			size: "sm",
		});
		expect(result).toContain("text-sm bg-blue-500");
	});

	it("should handle variant values as arrays in slots", () => {
		const styles = rcv({
			slots: {
				root: ["flex max-h-[180px]", "bg-background-strong", "rounded-50"],
				wrapper: ["flex", "items-center", "justify-center"],
			},
		});
		const { root, wrapper } = styles();
		expect(root()).toContain("bg-background-strong");
		expect(root()).toContain("rounded-50");
		expect(root()).toContain("flex max-h-[180px]");
		expect(wrapper()).toContain("flex");
		expect(wrapper()).toContain("items-center");
		expect(wrapper()).toContain("justify-center");
	});

	it("should apply compound variants when conditions match", () => {
		const result = getButtonVariants({
			intent: "primary",
			size: "lg",
			disabled: true,
		});
		const noResult = getButtonVariants({
			intent: "secondary",
			size: "sm",
			disabled: false,
		});
		expect(result).toContain("font-bold");
		expect(noResult).not.toContain("font-bold");
	});

	it("should handle responsive values", () => {
		const result = getButtonVariants({
			intent: { initial: "primary", md: "secondary" },
			size: { initial: "sm", md: "lg" },
			disabled: {
				initial: false,
				md: true,
			},
		});
		expect(result).toContain("bg-blue-500");
		expect(result).toContain("md:bg-gray-200");
		expect(result).toContain("cursor-pointer");
		expect(result).toContain("md:cursor-not-allowed");
		expect(result).toContain("md:opacity-50");
	});

	it("should merge custom className", () => {
		const result = getButtonVariants({
			intent: "primary",
			size: "lg",
			disabled: false,
			className: "custom-class",
		});
		expect(result).toContain("custom-class");
	});

	it("should handle multiple variants simultaneously", () => {
		const result = getButtonVariants({
			intent: "primary",
			size: "sm",
			disabled: true,
		});
		expect(result).toContain("bg-blue-500");
		expect(result).toContain("text-sm");
		expect(result).toContain("opacity-50");
	});

	it("should handle undefined values", () => {
		const result = getButtonVariants({ intent: undefined });
		expect(result).toBe("rounded px-4 py-2");
	});

	it("should handle className only if no variants are applied", () => {
		const getButtonVariants = rcv({
			base: "rounded px-4 py-2",
		});

		const result = getButtonVariants({ className: "custom-class" });
		expect(result).toBe("rounded px-4 py-2 custom-class");
	});

	it("should handle class prop as an alternative to className", () => {
		const getButtonVariants = rcv({
			base: "rounded px-4 py-2",
		});

		const result = getButtonVariants({ class: "custom-class" });
		expect(result).toBe("rounded px-4 py-2 custom-class");
	});

	it("should merge both class and className props", () => {
		const getButtonVariants = rcv({
			base: "rounded px-4 py-2",
		});

		const result = getButtonVariants({
			className: "from-className",
			class: "from-class",
		});
		expect(result).toBe("rounded px-4 py-2 from-className from-class");
	});
});

describe("mapResponsiveValue", () => {
	it("should map a singular value", () => {
		const result = mapResponsiveValue("sm", (size) => {
			switch (size) {
				case "sm":
					return "text-sm";
				case "md":
					return "text-md";
				case "lg":
					return "text-lg";
				default:
					return "text-base";
			}
		});

		expect(result).toBe("text-sm");
	});

	it("should map a responsive value with initial only", () => {
		const result = mapResponsiveValue({ initial: "sm" }, (size) => {
			switch (size) {
				case "sm":
					return "text-sm";
				case "md":
					return "text-md";
				case "lg":
					return "text-lg";
				default:
					return "text-base";
			}
		});

		expect(result).toEqual({ initial: "text-sm" });
	});

	it("should map a responsive value with multiple breakpoints", () => {
		const result = mapResponsiveValue(
			{ initial: "sm", md: "md", lg: "lg" },
			(size) => {
				switch (size) {
					case "sm":
						return "text-sm";
					case "md":
						return "text-md";
					case "lg":
						return "text-lg";
					default:
						return "text-base";
				}
			},
		);

		expect(result).toEqual({
			initial: "text-sm",
			md: "text-md",
			lg: "text-lg",
		});
	});

	it("should handle boolean values", () => {
		const result = mapResponsiveValue({ initial: true, md: false }, (value) =>
			value ? "visible" : "hidden",
		);

		expect(result).toEqual({
			initial: "visible",
			md: "hidden",
		});
	});

	it("should handle number values", () => {
		const result = mapResponsiveValue(
			{ initial: 1, md: 2, lg: 3 },
			(value) => value * 10,
		);

		expect(result).toEqual({
			initial: 10,
			md: 20,
			lg: 30,
		});
	});

	it("should handle singular number value", () => {
		const result = mapResponsiveValue<number, number>(5, (value) => value * 2);

		expect(result).toBe(10);
	});

	it("should handle singular boolean value", () => {
		const result = mapResponsiveValue<boolean, string>(true, (value) =>
			value ? "enabled" : "disabled",
		);

		expect(result).toBe("enabled");
	});

	it("should preserve all breakpoint keys", () => {
		const input = { initial: "a", sm: "b", md: "c", lg: "d", xl: "e" };
		const result = mapResponsiveValue(input, (v) => v.toUpperCase());

		expect(result).toEqual({
			initial: "A",
			sm: "B",
			md: "C",
			lg: "D",
			xl: "E",
		});
	});

	it("should work with custom breakpoints", () => {
		const result = mapResponsiveValue<
			string,
			string,
			"mobile" | "tablet" | "desktop"
		>({ initial: "small", mobile: "medium", desktop: "large" }, (size) =>
			size.toUpperCase(),
		);

		expect(result).toEqual({
			initial: "SMALL",
			mobile: "MEDIUM",
			desktop: "LARGE",
		});
	});

	it("should handle object transformation", () => {
		type Size = { width: number; height: number };
		const result = mapResponsiveValue<Size, string>(
			{
				initial: { width: 100, height: 50 },
				md: { width: 200, height: 100 },
			},
			(size) => `${size.width}x${size.height}`,
		);

		expect(result).toEqual({
			initial: "100x50",
			md: "200x100",
		});
	});
});

describe("createRcv", () => {
	it("should work with custom breakpoints", () => {
		const customRcv = createRcv(["xs", "sm", "md", "lg", "xl", "2xl"] as const);

		const getButtonVariants = customRcv({
			base: "px-4 py-2 rounded",
			variants: {
				intent: {
					primary: "bg-blue-500 text-white",
					secondary: "bg-gray-200 text-gray-800",
				},
				size: {
					sm: "text-sm",
					lg: "text-lg",
				},
			},
		});

		const result = getButtonVariants({
			intent: {
				initial: "primary",
				xs: "secondary",
				lg: "primary",
				"2xl": "secondary",
			},
			size: { initial: "sm", md: "lg" },
		});

		// Check that all expected classes are present, regardless of order
		expect(result).toContain("px-4 py-2 rounded");
		expect(result).toContain("bg-blue-500 text-white");
		expect(result).toContain("text-sm");
		expect(result).toContain("xs:bg-gray-200 xs:text-gray-800");
		expect(result).toContain("md:text-lg");
		expect(result).toContain("lg:bg-blue-500 lg:text-white");
		expect(result).toContain("2xl:bg-gray-200 2xl:text-gray-800");
	});

	it("should pass className when no variants are applied", () => {
		const customRcv = createRcv(["xs", "sm", "md", "lg", "xl", "2xl"] as const);
		const demoStyles = customRcv({
			base: "px-4 py-2 rounded",
		});
		const className = "custom-class";
		const result = demoStyles({ className });
		expect(result).toContain("custom-class");
	});

	it("should maintain backward compatibility with default breakpoints", () => {
		const defaultRcv = createRcv(["sm", "md", "lg", "xl"] as const);

		const getButtonVariants = defaultRcv({
			base: "px-4 py-2 rounded",
			variants: {
				intent: {
					primary: "bg-blue-500 text-white",
					secondary: "bg-gray-200 text-gray-800",
				},
			},
		});

		const result = getButtonVariants({
			intent: { initial: "primary", md: "secondary" },
		});

		expect(result).toBe(
			"px-4 py-2 rounded bg-blue-500 text-white md:bg-gray-200 md:text-gray-800",
		);
	});

	it("should call onComplete callback with the generated classes", () => {
		const defaultRcv = createRcv(["sm", "md", "lg", "xl"] as const, (classes) =>
			classes.split(" ").reverse().join(" "),
		);
		const getButtonVariants = defaultRcv({
			base: "px-4 py-2 rounded",
			variants: {
				intent: {
					primary: "bg-blue-500 text-white",
					secondary: "bg-gray-200 text-gray-800",
				},
				size: {
					sm: "text-sm",
					lg: "text-lg",
				},
			},
		});

		const result = getButtonVariants({
			intent: "primary",
			size: "sm",
		});

		expect(result).toBe("text-sm text-white bg-blue-500 rounded py-2 px-4");
	});
});

describe("slots", () => {
	it("should handle simple slots", () => {
		const demoStyles = rcv({
			slots: {
				base: "rounded-xl p-8 bg-white dark:bg-gray-900",
				title: "text-xl font-bold text-gray-900 dark:text-white",
				content: "text-gray-700 dark:text-gray-300",
			},
		});

		const { base, title, content } = demoStyles();

		expect(base()).toBe("rounded-xl p-8 bg-white dark:bg-gray-900");
		expect(title()).toBe("text-xl font-bold text-gray-900 dark:text-white");
		expect(content()).toBe("text-gray-700 dark:text-gray-300");
	});

	it("should handle slots with variants", () => {
		const demoStyles = rcv({
			slots: {
				base: "rounded-xl p-8 bg-white dark:bg-gray-900",
				title: "text-xl font-bold text-gray-900 dark:text-white",
				content: "text-gray-700 dark:text-gray-300",
			},
			variants: {
				shadow: {
					none: {},
					sm: { base: "shadow-sm" },
					md: { base: "shadow-md" },
					lg: { base: "shadow-lg" },
				},
				size: {
					sm: {
						title: "text-lg",
						content: "text-sm",
					},
					md: {
						title: "text-xl",
						content: "text-base",
					},
					lg: {
						title: "text-2xl",
						content: "text-lg",
					},
				},
			},
		});
		const { base, title, content } = demoStyles();

		expect(base({ shadow: "md" })).toContain("shadow-md");
		expect(title({ shadow: "md" })).toBe(
			"text-xl font-bold text-gray-900 dark:text-white",
		);
		expect(content({ shadow: "md" })).toBe("text-gray-700 dark:text-gray-300");

		expect(base({ size: "lg" })).toBe(
			"rounded-xl p-8 bg-white dark:bg-gray-900",
		);
		expect(title({ size: "lg" })).toContain("text-2xl");
		expect(content({ size: "lg" })).toContain("text-lg");

		expect(base({ shadow: "lg", size: "sm" })).toContain("shadow-lg");
		expect(title({ shadow: "lg", size: "sm" })).toContain("text-lg");
		expect(content({ shadow: "lg", size: "sm" })).toContain("text-sm");
	});

	it("should handle slots with compound variants", () => {
		const slotStyles = rcv({
			slots: {
				root: "rounded py-3 px-5 mb-4",
				title: "font-bold mb-1",
				message: "text-sm",
			},
			variants: {
				variant: {
					outlined: { root: "border" },
					filled: {},
				},
				severity: {
					error: {},
					success: {},
					warning: {},
				},
			},
			compoundVariants: [
				{
					variant: "outlined",
					severity: "error",
					class: {
						root: "border-red-700 dark:border-red-500",
						title: "text-red-700 dark:text-red-500",
						message: "text-red-600 dark:text-red-500",
					},
				},
				{
					variant: "outlined",
					severity: "success",
					class: {
						root: "border-green-700 dark:border-green-500",
						title: "text-green-700 dark:text-green-500",
						message: "text-green-600 dark:text-green-500",
					},
				},
				{
					variant: "filled",
					severity: "error",
					class: {
						root: "bg-red-100 dark:bg-red-800",
						title: "text-red-900 dark:text-red-50",
						message: "text-red-700 dark:text-red-200",
					},
				},
				{
					variant: "filled",
					severity: "warning",
					class: {
						root: "bg-yellow-100 dark:bg-yellow-800",
						title: "text-yellow-900 dark:text-yellow-50",
						message: "text-yellow-700 dark:text-yellow-200",
					},
				},
			],
		});
		const { root, title, message } = slotStyles();

		expect(root({ variant: "outlined", severity: "error" })).toContain(
			"border",
		);
		expect(root({ variant: "outlined", severity: "error" })).toContain(
			"border-red-700 dark:border-red-500",
		);
		expect(title({ variant: "outlined", severity: "error" })).toContain(
			"text-red-700 dark:text-red-500",
		);
		expect(message({ variant: "outlined", severity: "error" })).toContain(
			"text-red-600 dark:text-red-500",
		);

		expect(root({ variant: "filled", severity: "warning" })).toContain(
			"bg-yellow-100 dark:bg-yellow-800",
		);
		expect(title({ variant: "filled", severity: "warning" })).toContain(
			"text-yellow-900 dark:text-yellow-50",
		);
		expect(message({ variant: "filled", severity: "warning" })).toContain(
			"text-yellow-700 dark:text-yellow-200",
		);

		expect(root({ variant: "outlined", severity: "warning" })).toContain(
			"border",
		);
		expect(root({ variant: "outlined", severity: "warning" })).not.toContain(
			"border-red-700",
		);
		expect(root({ variant: "outlined", severity: "warning" })).not.toContain(
			"bg-yellow-100",
		);
		expect(title({ variant: "outlined", severity: "warning" })).toBe(
			"font-bold mb-1",
		);
		expect(message({ variant: "outlined", severity: "warning" })).toBe(
			"text-sm",
		);
	});

	it("should handle slots with responsive values", () => {
		const responsiveSlots = rcv({
			slots: {
				base: "rounded-xl p-4 bg-white",
				title: "font-bold text-gray-900",
			},
			variants: {
				size: {
					sm: {
						base: "p-2",
						title: "text-sm",
					},
					lg: {
						base: "p-8",
						title: "text-2xl",
					},
				},
			},
		});
		const { base, title } = responsiveSlots();

		expect(base({ size: { initial: "sm", md: "lg" } })).toContain("p-2");
		expect(base({ size: { initial: "sm", md: "lg" } })).toContain("md:p-8");
		expect(title({ size: { initial: "sm", md: "lg" } })).toContain("text-sm");
		expect(title({ size: { initial: "sm", md: "lg" } })).toContain(
			"md:text-2xl",
		);
	});

	it("should handle slots with custom className", () => {
		const slotStyles = rcv({
			slots: {
				base: "rounded-xl p-8 bg-white",
				title: "text-xl font-bold",
			},
			variants: {},
		});
		const { base, title } = slotStyles();

		expect(base({ className: "custom-base-class" })).toContain(
			"custom-base-class",
		);
		expect(title({ className: "custom-title-class" })).toContain(
			"custom-title-class",
		);
	});

	it("should handle slots with class prop", () => {
		const slotStyles = rcv({
			slots: {
				base: "rounded-xl p-8 bg-white",
				title: "text-xl font-bold",
			},
			variants: {},
		});
		const { base, title } = slotStyles();

		expect(base({ class: "custom-base-class" })).toContain("custom-base-class");
		expect(title({ class: "custom-title-class" })).toContain(
			"custom-title-class",
		);
	});

	it("should merge both class and className props in slots", () => {
		const slotStyles = rcv({
			slots: {
				base: "rounded-xl p-8 bg-white",
			},
			variants: {},
		});
		const { base } = slotStyles();

		expect(
			base({ className: "from-className", class: "from-class" }),
		).toContain("from-className");
		expect(
			base({ className: "from-className", class: "from-class" }),
		).toContain("from-class");
	});

	it("should handle compound variants with className as slot mapping", () => {
		const slotStyles = rcv({
			slots: {
				root: "rounded py-3 px-5",
				title: "font-bold",
			},
			variants: {
				variant: {
					primary: {},
					secondary: {},
				},
			},
			compoundVariants: [
				{
					variant: "primary",
					className: {
						root: "bg-blue-500",
						title: "text-white",
					},
				},
			],
		});
		const { root, title } = slotStyles();

		expect(root({ variant: "primary" })).toContain("bg-blue-500");
		expect(title({ variant: "primary" })).toContain("text-white");
		expect(root({ variant: "secondary" })).not.toContain("bg-blue-500");
	});

	it("should handle compound variants with className as string", () => {
		const slotStyles = rcv({
			slots: {
				root: "rounded py-3 px-5",
				title: "font-bold",
			},
			variants: {
				variant: {
					primary: {},
					secondary: {},
				},
			},
			compoundVariants: [
				{
					variant: "primary",
					className: "applied-to-all-slots",
				},
			],
		});
		const { root, title } = slotStyles();

		expect(root({ variant: "primary" })).toContain("applied-to-all-slots");
		expect(title({ variant: "primary" })).toContain("applied-to-all-slots");
	});

	it("should merge both class and className in compound variants", () => {
		const slotStyles = rcv({
			slots: {
				root: "rounded",
				title: "font-bold",
			},
			variants: {
				variant: {
					primary: {},
				},
			},
			compoundVariants: [
				{
					variant: "primary",
					class: {
						root: "from-class-root",
						title: "from-class-title",
					},
					className: {
						root: "from-className-root",
						title: "from-className-title",
					},
				},
			],
		});
		const { root, title } = slotStyles();

		expect(root({ variant: "primary" })).toContain("from-class-root");
		expect(root({ variant: "primary" })).toContain("from-className-root");
		expect(title({ variant: "primary" })).toContain("from-class-title");
		expect(title({ variant: "primary" })).toContain("from-className-title");
	});
});
