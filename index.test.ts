import { describe, expect, it } from "vitest";
import { createRcv, rcv } from "./index";

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
		// @ts-expect-error - undefined is not assignable to type 'ResponsiveValue<"primary" | "secondary">'
		const result = getButtonVariants({ intent: undefined });
		expect(result).toBe("rounded px-4 py-2");
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
		const onComplete = (classes: string) =>
			classes.split(" ").reverse().join(" ");
		const defaultRcv = createRcv(["sm", "md", "lg", "xl"] as const, onComplete);
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
