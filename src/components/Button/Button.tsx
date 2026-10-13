import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
}

const Button = ({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`.trim()}
    {...rest}
  />
);

export default Button;
