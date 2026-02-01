import { RoleVO } from '@/api/system/role/types';

/**
 * 用户信息
 */
export interface UserInfo {
  user: UserVO;
  roles: string[];
  permissions: string[];
}

/**
 * 用户查询对象类型
 */
export interface UserQuery extends PageQuery {
  userName?: string;
  nickName?: string;
    realName?: string;
  phonenumber?: string;
  status?: string;
  roleId?: string | number;
  userIds?:  string | number | (string | number)[] | undefined;
}

/**
 * 用户返回对象
 */
export interface UserVO extends BaseEntity {
  userId: string | number;
  userName: string;
  nickName: string;
  realName: string;
  userType: string;
  email: string;
  phonenumber: string;
  sex: string;
  avatar: string;
  status: string;
  delFlag: string;
  loginDate: string;
  remark: string;
  roles: RoleVO[];
  assets: JSON;
  meta: JSON;
}

/**
 * 用户角色DTO
 */
export interface UserRoleDTO {
  roleId: string | number;
  expireTime?: string | Date | null;
}

/**
 * 用户表单对象
 */
export interface UserForm {
  id?: string;
  userId?: string;
  userName: string;
  nickName?: string;
  password: string;
  phonenumber?: string;
  email?: string;
  sex?: string;
  status: string;
  remark?: string;
  userRoles: UserRoleDTO[];
realName?: string;
    idCard?: string;
    alipayUsername?: string;
}

export interface UserInfoVO {
  user: UserVO;
  roles: RoleVO[];
  roleIds: string[];
}

export interface ResetPwdForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
