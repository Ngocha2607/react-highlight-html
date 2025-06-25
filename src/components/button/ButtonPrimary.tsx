import React from 'react';
import BaseButton from './BaseButton';
import { IButtonBaseProps } from '../../type/common';

const ButtonPrimary = ({
  title,
  onClick,
  className = '',
  link,
  size = 'small',
  disabled = false,
  startIcon,
  endIcon,
  full = false,
  children,
  ...props
}: IButtonBaseProps) => {
  let textSizeClass =
    size === 'small' ? 'text-sm' : size === 'medium' ? 'text-base' : 'text-lg';
  let padding =
    size === 'small'
      ? 'py-2 px-4'
      : size === 'medium'
        ? 'py-3 px-6'
        : 'py-4 px-8';
  let fullWidthClass = full ? 'block w-full' : 'inline-block';
  let disabledClass = disabled
    ? 'cursor-not-allowed !bg-gray-100 !text-gray-400 hover:!bg-gray-100 hover:!text-gray-400 hover:!border-gray-100'
    : 'cursor-pointer';
  let componentClass = `text-center text-white font-medium bg-secondary-600 hover:!text-white hover:!bg-secondary border-none ${fullWidthClass} ${padding} ${disabledClass} ${textSizeClass} ${className}`;

  return (
    <BaseButton
      className={`${componentClass}`}
      onClick={onClick}
      disabled={disabled}
      link={link}
      {...props}
    >
      <div className="flex items-center gap-2.5">
        {startIcon && <div className="w-full">{startIcon}</div>}
        <div className="w-full">{title || children}</div>
        {endIcon && <div className="w-full">{endIcon}</div>}
      </div>
    </BaseButton>
  );
};

export default ButtonPrimary;
