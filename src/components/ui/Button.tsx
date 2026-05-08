import { Link, type LinkProps } from 'react-router-dom'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-md whitespace-nowrap'

const variants: Record<Variant, string> = {
  primary: 'bg-surface-900 text-white hover:bg-surface-800',
  secondary: 'border border-surface-300 text-surface-900 bg-white hover:bg-surface-50',
  ghost: 'text-surface-700 hover:text-surface-900 hover:bg-surface-100',
  accent: 'bg-accent-500 text-white hover:bg-accent-600',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export const buttonClasses = (variant: Variant = 'primary', size: Size = 'md') =>
  `${base} ${variants[variant]} ${sizes[size]}`

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

export function Button({ variant, size, className = '', ...rest }: ButtonProps) {
  return <button className={`${buttonClasses(variant, size)} ${className}`} {...rest} />
}

type ButtonLinkProps = LinkProps & {
  variant?: Variant
  size?: Size
}

export function ButtonLink({ variant, size, className = '', ...rest }: ButtonLinkProps) {
  return <Link className={`${buttonClasses(variant, size)} ${className}`} {...rest} />
}
