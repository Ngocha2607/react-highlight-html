import React from 'react';
import { Button, ButtonProps } from 'antd';
import { FC } from 'react';

export interface BaseButtonProps extends ButtonProps {
  link?: string;
}

const BaseButton: FC<BaseButtonProps> = ({
  children,
  className,
  link,
  ...props
}) => {
  const baseClassName =
    '!shadow-none outline-none inline-block h-fit box-border flex items-center justify-center';

  if (link) {
    return (
      <a href={link}>
        <Button {...props} className={`${baseClassName} ${className}`}>
          {children}
        </Button>
      </a>
    );
  }

  return (
    <Button {...props} className={`${baseClassName} ${className}`}>
      {children}
    </Button>
  );
};

export default BaseButton;
