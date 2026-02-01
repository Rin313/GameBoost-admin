import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { UserForm, UserQuery, UserVO, UserInfoVO } from './types';
import { parseStrEmpty } from '@/utils/ruoyi';

/**
 * 查询用户列表
 * @param query
 */
export const listUser = (query: UserQuery): AxiosPromise<UserVO[]> => {
  return request({
    url: '/system/user/list',
    method: 'get',
    params: query
  });
};
export const listPlayers = (query: UserQuery): AxiosPromise<UserVO[]> => {
  return request({
    url: '/system/user/listPlayers',
    method: 'get',
    params: query
  });
};

/**
 * 获取用户详情
 * @param userId
 */
export const getUser = (userId?: string | number): AxiosPromise<UserInfoVO> => {
  return request({
    url: '/system/user/' + parseStrEmpty(userId),
    method: 'get'
  });
};

export const addUser = (data: UserForm) => {
  return request({
    url: '/system/user/insert',
    method: 'post',
    data: data
  });
};

export const updateUser = (data: UserForm) => {
  return request({
    url: '/system/user/update',
    method: 'post',
    data: data
  });
};

export const delUser = (userId: Array<string | number> | string | number) => {
  return request({
    url: '/system/user/delete/' + userId,
    method: 'post'
  });
};

export const activeUser = (userIds) => {
  return request({
    url: '/system/user/active',
    method: 'post',
    data: userIds
  });
};


/**
 * 用户密码重置
 * @param userId 用户ID
 * @param password 密码
 */
export const resetUserPwd = (userId: string | number, password: string) => {
  const data = {
    userId,
    password
  };
  return request({
    url: '/system/user/resetPwd',
    method: 'post',
    headers: {
      repeatSubmit: false
    },
    data: data
  });
};


/**
 * 查询用户个人信息
 */
export const getUserProfile = (): AxiosPromise<UserInfoVO> => {
  return request({
    url: '/system/user/getInfo',
    method: 'get'
  });
};

/**
 * 修改用户个人信息
 * @param data 用户信息
 */
export const updateUserProfile = (data: FormData) => {
  return request({
    url: '/system/user/updateProfile',
    method: 'post',
    data: data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * 用户密码重置
 * @param oldPassword 旧密码
 * @param newPassword 新密码
 */
export const updateUserPwd = (oldPassword: string, newPassword: string) => {
  const data = {
    oldPassword,
    newPassword
  };
  return request({
    url: '/system/user/updatePwd',
    method: 'post',
    headers: {
      repeatSubmit: false
    },
    data: data
  });
};

/**
 * 用户头像上传
 * @param data 头像文件
 */
export const uploadAvatar = (data: FormData) => {
  return request({
    url: '/system/user/avatar',
    method: 'post',
    data: data
  });
};

export const updateCredit = (userIds, bizType: string, changes: string | number,force) => {
  const data = {
    userIds,
    bizType,
    changes,
    force
  };
  return request({
    url: '/bizLog/updateCredit',
    method: 'post',
    data: data
  });
};
export const updateDeposit = (userIds, bizType: string, changes: string | number,force) => {
  const data = {
    userIds,
    bizType,
    changes,
    force
  };
  return request({
    url: '/bizLog/updateDeposit',
    method: 'post',
    data: data
  });
};

export default {
  listUser,
  getUser,
  addUser,
  updateUser,
  delUser,
  activeUser,
  resetUserPwd,
  getUserProfile,
  updateUserProfile,
  updateUserPwd,
  uploadAvatar,
  updateCredit,
  updateDeposit,
  listPlayers
};
