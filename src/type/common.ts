import { ButtonProps } from 'antd';

export interface IButtonBaseProps extends Omit<ButtonProps, 'size'> {
  size?: 'small' | 'medium' | 'large' | 'extra';
  link?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  full?: boolean;
  title?: string;
  children?: React.ReactNode;
  isUnderLine?: boolean;
}
