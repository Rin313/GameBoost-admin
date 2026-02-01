import { getToken, removeToken, setToken } from '@/utils/auth';
import { login as loginApi, logout as logoutApi, getInfo as getUserInfo } from '@/api/login';
import { LoginData } from '@/api/types';
import defAva from '@/assets/images/profile.jpg';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken());
  const name = ref('');
  const nickname = ref('');
  const userId = ref<string | number>('');
  const avatar = ref('');
  const roles = ref<Array<string>>([]); // 用户角色编码集合 → 判断路由权限
  const permissions = ref<Array<string>>([]); // 用户权限编码集合 → 判断按钮权限

  const login = async (userInfo: LoginData): Promise<void> => {
    try {
        const res = await loginApi(userInfo);
        const data = res.data;
        setToken(data.accessToken);
        token.value = data.accessToken;
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
  };

  // 获取用户信息
  const getInfo = async (): Promise<void> => {
    try{
        const res=await getUserInfo();
        const data = res.data;
        const user = data.user;
        const profile = user.avatar == '' || user.avatar == null ? defAva : user.avatar;

        if (data.roles && data.roles.length > 0) {
            // 验证返回的roles是否是一个非空数组
            roles.value = data.roles;
            permissions.value = data.permissions;
        } else {
            roles.value = ['ROLE_DEFAULT'];
        }
        name.value = user.userName;
        nickname.value = user.nickName;
        avatar.value = profile;
        userId.value = user.userId;
        return Promise.resolve();
    }
    catch(err){
        return Promise.reject(err);
    }
  };

  // 注销
  const logout = async (): Promise<void> => {
    await logoutApi();
    token.value = '';
    roles.value = [];
    permissions.value = [];
    removeToken();
  };

  const setAvatar = (value: string) => {
    avatar.value = value;
  };

  return {
    userId,
    token,
    nickname,
    avatar,
    roles,
    permissions,
    login,
    getInfo,
    logout,
    setAvatar
  };
});
