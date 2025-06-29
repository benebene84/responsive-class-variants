# Responsive Class Variants

rcv helps you create responsive class variants

## Installation

```bash
pnpm add responsive-class-variants
```

## Usage

```ts
const getButtonVariants = rcv({
  base: "px-4 py-2 rounded",
  variants: {     
    intent: {
       primary: "bg-blue-500 text-white",
       secondary: "bg-gray-200 text-gray-800"
     },
     size: {
       sm: "text-sm",
       lg: "text-lg"
     },
     disabled: {
       true: "opacity-50 cursor-not-allowed"
     }
   }
 });

 // Usage:
 getButtonVariants({ intent: "primary", size: "lg", disabled: true })
 // Or with responsive values:
 getButtonVariants({ intent: { initial: "primary", md: "secondary" } })