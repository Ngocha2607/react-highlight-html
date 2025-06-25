import React from 'react';
import { IButtonBaseProps } from '../../type/common';
import BaseButton from './BaseButton';

const ButtonSecondary = ({
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
      ? 'py-[7px] px-[15px]'
      : size === 'medium'
        ? 'py-[11px] px-[23px]'
        : 'py-[15px] px-[31px]';

  let fullWidthClass = full ? 'block w-full' : 'inline-block';
  let disabledClass = disabled
    ? 'cursor-not-allowed !bg-gray-100 !text-gray-400 hover:!bg-gray-100 hover:!text-gray-400 hover:!border-gray-100'
    : 'cursor-pointer';

  let componentClass = `
    text-center
    text-secondary
    hover:!text-secondary
    bg-transparent
    rounded-lg
    border border-secondary
    hover:!border-secondary
    hover:!bg-gray-100
    box-border
    font-medium
    ${padding}
    ${textSizeClass}
    ${fullWidthClass}
    ${disabledClass} 
    ${className}
  `;

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

export default ButtonSecondary;
