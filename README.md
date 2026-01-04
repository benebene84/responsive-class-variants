# Responsive Class Variants

rcv helps you create responsive class variants. It handles the logic of generating the classes and prefixes them with the breakpoint name. You will still need to make sure, that the CSS is available for the breakpoints you use.

## Features

- Handles the logic of generating the classes and prefixes them with the breakpoint name.
- You just need to provide the base classes, the variants and optionally compound variants.
- **Slots support**: Create multiple class-generating functions for different parts of a component.
- **Framework agnostic**: Supports both `className` (React) and `class` (Svelte, Vue, SolidJS) props.
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

### Basic Usage (Single Component):

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
 // You can also pass additional classes via className or class:
 getButtonVariants({ intent: "primary", className: "my-custom-class" })
 getButtonVariants({ intent: "primary", class: "my-custom-class" }) // For Svelte, Vue, SolidJS
```

### Slots (Multi-Part Components):

When you need to style multiple parts of a component, you can use slots. This is perfect for complex components like cards, alerts, or modals.

#### Simple Slots

```ts
const getCardVariants = rcv({
  slots: {
    base: "rounded-xl p-8 bg-white dark:bg-gray-900",
    title: "text-xl font-bold text-gray-900 dark:text-white",
    content: "text-gray-700 dark:text-gray-300"
  }
});

// Usage - call the factory before destructuring the slot functions
const { base, title, content } = getCardVariants();

// Apply to your JSX - no arguments needed for simple slots!
<div className={base()}>
  <h2 className={title()}>Card Title</h2>
  <p className={content()}>Card content goes here</p>
</div>
```

#### Slots with Variants

Variants can target specific slots by using objects instead of strings:

```ts
const getCardVariants = rcv({
  slots: {
    base: "rounded-xl p-8 bg-white dark:bg-gray-900",
    title: "text-xl font-bold text-gray-900 dark:text-white",
    content: "text-gray-700 dark:text-gray-300"
  },
  variants: {
    shadow: {
      none: {},
      sm: { base: "shadow-sm" },
      md: { base: "shadow-md" },
      lg: { base: "shadow-lg" }
    },
    size: {
      sm: { 
        title: "text-lg",
        content: "text-sm"
      },
      lg: { 
        title: "text-2xl",
        content: "text-lg"
      }
    }
  }
});

const { base, title, content } = getCardVariants();

// Usage with variants
<div className={base({ shadow: "md", size: "lg" })}>
  <h2 className={title({ shadow: "md", size: "lg" })}>Large Card Title</h2>
  <p className={content({ shadow: "md", size: "lg" })}>Larger content text</p>
</div>
```

#### Slots with Compound Variants

Compound variants can target specific slots using either the `class` or `className` property. Both accept either a string (applied to all slots) or an object mapping slot names to classes:

```ts
const getAlertVariants = rcv({
  slots: {
    root: "rounded py-3 px-5 mb-4",
    title: "font-bold mb-1",
    message: "text-sm"
  },
  variants: {
    variant: {
      outlined: { root: "border" },
      filled: {}
    },
    severity: {
      error: {},
      success: {},
      warning: {}
    }
  },
  compoundVariants: [
    {
      variant: "outlined",
      severity: "error",
      class: {
        root: "border-red-700 dark:border-red-500",
        title: "text-red-700 dark:text-red-500",
        message: "text-red-600 dark:text-red-500"
      }
    },
    {
      variant: "filled",
      severity: "success",
      // You can use className instead of class - both work the same way
      className: {
        root: "bg-green-100 dark:bg-green-800",
        title: "text-green-900 dark:text-green-50",
        message: "text-green-700 dark:text-green-200"
      }
    },
    {
      variant: "filled",
      severity: "warning",
      // You can also use a string to apply the same class to all slots
      class: "warning-styles"
    }
  ]
});

const { root, title, message } = getAlertVariants();

// Usage
<div className={root({ variant: "outlined", severity: "error" })}>
  <h3 className={title({ variant: "outlined", severity: "error" })}>Error!</h3>
  <p className={message({ variant: "outlined", severity: "error" })}>Something went wrong</p>
</div>
```

#### Slots with Responsive Values

Slots work seamlessly with responsive values:

```ts
const getCardVariants = rcv({
  slots: {
    base: "rounded-xl p-4 bg-white",
    title: "font-bold text-gray-900"
  },
  variants: {
    size: {
      sm: { 
        base: "p-2",
        title: "text-sm"
      },
      lg: { 
        base: "p-8",
        title: "text-2xl"
      }
    }
  }
});

const { base, title } = getCardVariants();

// Responsive usage
<div className={base({ size: { initial: "sm", md: "lg" } })}>
  <h2 className={title({ size: { initial: "sm", md: "lg" } })}>Responsive Card</h2>
</div>
```

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

// Works with slots too:
const getCardVariants = rcv({
  slots: {
    base: "rounded-xl p-4 bg-white",
    title: "font-bold text-gray-900"
  },
  variants: {
    size: {
      sm: { base: "p-2", title: "text-sm" },
      lg: { base: "p-8", title: "text-2xl" }
    }
  }
});
```

## onComplete callback (via createRcv)

You can pass an optional onComplete callback to the createRcv function. This callback will be called with the generated classes. Helpful if you want to pass your classes to a library like tailwind Merge.

```ts
const rcv = createRcv(['mobile', 'tablet', 'desktop'], (classes) => twMerge(classes));
```

## Using `class` vs `className`

rcv supports both `class` and `className` props for maximum framework compatibility:

- **React**: Use `className` (standard React convention)
- **Svelte, Vue, SolidJS**: Use `class` (standard HTML attribute)

Both props work identically and can even be used together (they will be merged):

```ts
// React style
getButtonVariants({ intent: "primary", className: "extra-class" })

// Svelte/Vue/SolidJS style  
getButtonVariants({ intent: "primary", class: "extra-class" })

// Both can be used together (merged)
getButtonVariants({ intent: "primary", className: "from-react", class: "from-other" })
// Result includes both "from-react" and "from-other"
```

In compound variants with slots, both `class` and `className` accept either:
- A **string**: Applied to all slots when the compound variant matches
- A **slot mapping object**: Applied to specific slots

```ts
compoundVariants: [
  // String - applies to all slots
  { variant: "outlined", className: "border" },
  
  // Object - targets specific slots (works with both class and className)
  { variant: "filled", class: { root: "bg-blue-500", title: "text-white" } },
  { variant: "special", className: { root: "special-root", title: "special-title" } },
]
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
