import React from 'react';
import clsx from 'clsx';
export enum UserType {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
}
export enum IUserStatus {
  ACTIVE = 'ACTIVE',
}
export interface IUserDetail {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: null | string;
  country_code: null | string;
  email: string;
  phone: string;
  firstName: null | string;
  lastName: null | string;
  full_name: string;
  address: string;
  level: string;
  provinceCode: null | string;
  districtCode: null | string;
  wardCode: null | string;
  dob: null | string;
  avatar: { [key: string]: string };
  sex: string;
  permanent_address: null | string;
  identity_card: null | string;
  date_of_issue: null | string;
  place_of_issue: null | string;
  is_verify: boolean;
  is_default: boolean;
  contact_detail: string;
  settings: null | any;
}
export interface IUser {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: null | string;
  key: string;
  invite_id: null | string;
  code: null | string;
  username: string;
  nick_name: null | string;
  type: UserType;
  status: IUserStatus;
  detail_id: string;
  detail: IUserDetail;
}
interface IProps {
  className?: string;
  onClick?: () => void;
  description?: React.ReactNode;
  isShowType?: boolean;
  user: IUser;
}
const AvatarCard = ({
  className,
  onClick,
  description,
  isShowType = true,
  user,
}: IProps) => {
  return (
    <div className={clsx('flex items-center', className)} onClick={onClick}>
      <div className="h-10 w-10 shrink-0">
        {user?.detail?.avatar['40x40'] || user.detail.avatar['ORIGIN'] ? (
          <img
            src={user.detail.avatar['40x40'] || user.detail.avatar['ORIGIN']}
            alt="avatar"
            className="h-10 w-10 rounded-full object-cover"
            width={40}
            height={40}
          />
        ) : (
          <div className="rounded-full bg-gray-200 w-10 h-10" />
        )}
      </div>
      <div
        className={`label avatar pl-4 text-base font-normal text-gray-800 transition-all duration-150 group-hover:text-white`}
      >
        <div className="line-clamp-1 text-base font-semibold text-[#050505] group-hover:text-white">
          {user?.detail?.full_name}
        </div>
        {description && (
          <div className="line-clamp-1 text-sm font-normal lowercase text-[#A1A1A1] group-hover:text-white">
            {description}
          </div>
        )}
        {isShowType && (
          <div className="line-clamp-1 text-sm font-normal capitalize text-[#A1A1A1] group-hover:text-white">
            {user?.type?.toLowerCase()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarCard;
