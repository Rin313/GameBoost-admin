export type RegisterForm = {
  username: string;
  password: string;
  confirmPassword?: string;
  code?: string;
  uuid?: string;
};
export type ApplicateForm = {
  username: string;
  password: string;
  confirmPassword?: string;
  code?: string;
  uuid?: string;
  phonenumber?: string;
  realName?: string;
  idCard?: string;
};

/**
 * 登录请求
 */
export interface LoginData {
  username?: string;
  password?: string;
  rememberMe?: boolean;
  socialCode?: string;
  socialState?: string;
  source?: string;
  code?: string;
  uuid?: string;
  grantType: string;
}

/**
 * 登录响应
 */
export interface LoginResult {
  accessToken: string;
}

/**
 * 验证码返回
 */
export interface VerifyCodeResult {
  uuid?: string;
  img?: string;
}
