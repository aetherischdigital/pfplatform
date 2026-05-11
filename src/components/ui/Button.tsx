import { Link, type LinkProps } from 'react-router-dom'
import type { ButtonHTMLAttributes } from 'react'
import { buttonClasses, type ButtonVariant, type ButtonSize } from './buttonStyles'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ variant, size, className = '', ...rest }: ButtonProps) {
  return <button className={`${buttonClasses(variant, size)} ${className}`} {...rest} />
}

type ButtonLinkProps = LinkProps & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function ButtonLink({ variant, size, className = '', ...rest }: ButtonLinkProps) {
  return <Link className={`${buttonClasses(variant, size)} ${className}`} {...rest} />
}
