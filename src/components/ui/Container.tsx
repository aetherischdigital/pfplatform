import type { HTMLAttributes } from 'react'

type Size = 'sm' | 'md' | 'lg'

const sizes: Record<Size, string> = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
}

export default function Container({
  size = 'lg',
  className = '',
  ...rest
}: HTMLAttributes<HTMLDivElement> & { size?: Size }) {
  return <div className={`mx-auto w-full px-6 ${sizes[size]} ${className}`} {...rest} />
}
