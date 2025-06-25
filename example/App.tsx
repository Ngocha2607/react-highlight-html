import React from 'react';
// 👇 Import trực tiếp từ src để test local
import { HighlightableHTML } from '../src';
import {
  IUser,
  IUserStatus,
  UserType,
} from '../src/components/card/AvatarCard';

const htmlString = `
  <p>This is a <strong>React</strong> highlight test.</p>
`;
const testUser: IUser = {
  id: 'user_123456',
  created_at: '2025-06-25T10:00:00Z',
  updated_at: '2025-06-25T10:30:00Z',
  deleted_at: null,
  key: 'key_abcdef',
  invite_id: null,
  code: null,
  username: 'dominicle',
  nick_name: 'Dom',
  type: UserType.STUDENT,
  status: IUserStatus.ACTIVE,
  detail_id: 'detail_123456',
  detail: {
    id: 'detail_123456',
    created_at: '2025-06-25T09:50:00Z',
    updated_at: '2025-06-25T10:00:00Z',
    deleted_at: null,
    country_code: 'VN',
    email: 'dom@example.com',
    phone: '+84901234567',
    firstName: 'Lê',
    lastName: 'Ngọc Hà',
    full_name: 'Lê Ngọc Hà',
    address: '123 Nguyễn Trãi, Hà Nội',
    level: 'Đại học',
    provinceCode: '01',
    districtCode: '001',
    wardCode: '00001',
    dob: '2000-07-26',
    avatar: {
      small: 'https://example.com/avatar-small.jpg',
      medium: 'https://example.com/avatar-medium.jpg',
      large: 'https://example.com/avatar-large.jpg',
    },
    sex: 'male',
    permanent_address: '123 Trần Duy Hưng, Hà Nội',
    identity_card: '123456789',
    date_of_issue: '2018-01-15',
    place_of_issue: 'CA Hà Nội',
    is_verify: true,
    is_default: true,
    contact_detail: 'Zalo: 0901234567',
    settings: {
      language: 'vi',
      theme: 'dark',
    },
  },
};
export default function App() {
  return (
    <div style={{ padding: 32, fontFamily: 'Arial' }}>
      <h1>Test react-highlight-html</h1>
      <div style={{ border: '1px solid #ddd', padding: 16 }}>
        <HighlightableHTML
          initialHTML={htmlString}
          storageKey="test"
          user={testUser}
        />
      </div>
    </div>
  );
}
