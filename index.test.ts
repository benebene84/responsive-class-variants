import { describe, expect, it } from "vitest";
import { rcv } from "./index";

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
