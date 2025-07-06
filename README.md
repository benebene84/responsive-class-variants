# Responsive Class Variants

rcv helps you create responsive class variants. It handles the logic of generating the classes and prefixes them with the breakpoint name. You will still need to make sure, that the CSS is available for the breakpoints you use.

## Features

- Handles the logic of generating the classes and prefixes them with the breakpoint name.
- You just need to provide the base classes, the variants and optionally compound variants.
- You can use the default breakpoints (sm, md, lg, xl) or provide your own.
- You can pass an optional onComplete callback to the createRcv function. This callback will be called with the generated classes. Helpful if you want to pass your classes to a library like twMerge.

## Installation

```bash
pnpm add responsive-class-variants
```

## Usage

rcv is a function that takes a config object and returns a function that takes a props object and returns a string of classes. The props object is an object with the keys of the variants and the values are the values of the variants.

The config object has the following properties:

- base: The base classes that are always applied.
- variants: An object with the keys of the variants and the values are the values of the variants.
- compoundVariants: An array of compound variants that apply additional classes when multiple variants have specific values.
- onComplete: An optional callback function that receives the generated classes and returns the final classes.

rcv works very well with tailwindcss but it can be used with any CSS solution.

### With tailwind classes:

```ts
const getButtonVariants = rcv({
  base: "px-4 py-2 rounded",
  variants: {     
    intent: {
       primary: "bg-blue-500 text-white",
       secondary: "bg-gray-200 text-gray-800"
     },
     size: {
       small: "text-sm",
       large: "text-lg"
     },
     disabled: {
       true: "opacity-50 cursor-not-allowed"
     },
     error: {
       true: "bg-red-500 text-white"
     }
   },
   compoundVariants: [
     {
       disabled: true,
       error: true,
       className: "opacity-50 cursor-not-allowed"
     }
   ]
 });

 // Usage:
 getButtonVariants({ intent: "primary", size: "large", disabled: true })
 // Or with responsive values:
 getButtonVariants({ intent: { initial: "primary", md: "secondary" } })

 ```
 Because of the tailwind JIT compiler, you need to make sure, that all possible classes are available with your component. Let's say you have a button component and you want to use the `size` variant responsively. You need to make sure, that the `small` and `large` classes are available with your component. You can e.g. define a `SIZES` object to define the classes for each size and breakpoints. This example assumes you have the default breakpoints (sm, md, lg, xl).

 ```ts
 const SIZES = {
  sm: {
    sm: "sm:text-sm",
    lg: "sm:text-lg"
  },
  md: {
    sm: "md:text-sm",
    lg: "md:text-lg"
  },
  lg: {
    sm: "lg:text-sm",
    lg: "lg:text-lg"
  },
  xl: {
    sm: "xl:text-sm",
    lg: "xl:text-lg"
  }
 }
 ```

 The structure doesn't really matter, the classes just need to be in the compiled javascript to be picked up by the JIT compiler.

### With css classes (like BEM or any other naming convention):

```ts
const getButtonVariants = rcv({
  base: "btn",
  variants: {
    intent: {
      primary: "btn--primary",
      secondary: "btn--secondary"
    },
    size: {
      small: "btn--sm",
      large: "btn--lg"
    },
    disabled: {
      true: "btn--disabled"
    },
    error: {
      true: "btn--error"
    }
  },
  compoundVariants: [
    {
      disabled: true,
      error: true,
      className: "btn--disabled--error"
    }
  ]
});
```

## Custom breakpoints (via createRcv)

```ts
const rcv = createRcv(['mobile', 'tablet', 'desktop']);

const getButtonVariants = rcv({
  base: "px-4 py-2 rounded",
  variants: {
    intent: {
      primary: "bg-blue-500 text-white",
      secondary: "bg-gray-200 text-gray-800"
    }
  }
});

// Usage with custom breakpoints:
getButtonVariants({ intent: { initial: "primary", mobile: "secondary", desktop: "primary" } })
```

## onComplete callback (via createRcv)

You can pass an optional onComplete callback to the createRcv function. This callback will be called with the generated classes. Helpful if you want to pass your classes to a library like tailwind Merge.

```ts
const rcv = createRcv(['mobile', 'tablet', 'desktop'], (classes) => twMerge(classes));
```

## Typescript helpers

rcv provides a helper type to make it easier to type your component props.

If you use the default breakpoints (sm, md, lg, xl), you can use the `ResponsiveValue` type to make existing props responsive.

```ts
type ButtonProps = {
  intent: "primary" | "secondary";
  size: ResponsiveValue<"sm" | "lg">;
  disabled: boolean;
  error: boolean;
};
```

If you use custom breakpoints you need to pass the breakpoints to the `ResponsiveValue` type.

```ts
import { createRcv, type ResponsiveValue as RcvResponsiveValue } from "responsive-class-variants";

const breakpoints = ["tablet", "desktop", "wide"] as const;

export const customRcv = createRcv(breakpoints);

type Breakpoints = (typeof breakpoints)[number];

export type ResponsiveValue<T> = RcvResponsiveValue<T, Breakpoints>;
```
