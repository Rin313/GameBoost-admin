<template>
  <div class="login-wrapper">
    <div class="login-box">
      <div class="login-left">
        <img src="../assets/images/Innovation-bro.png"/>
      </div>
      <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
        <div class="welcome-text">{{ proxy.$t('login.welcome') }}</div>

        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            size="large" 
            :placeholder="proxy.$t('login.username')"
          >
            <template #prefix><svg-icon icon-class="user" class="input-icon" /></template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            size="large"
            show-password
            :placeholder="proxy.$t('login.password')"
            @keyup.enter="handleLogin"
          >
            <template #prefix><svg-icon icon-class="password" class="input-icon" /></template>
          </el-input>
        </el-form-item>

        <el-form-item v-if="captchaEnabled" prop="code">
          <div class="captcha-box">
            <el-input
              v-model="loginForm.code"
              size="large"
              :placeholder="proxy.$t('login.code')"
              class="captcha-input"
              @keyup.enter="handleLogin"
            >
              <template #prefix><svg-icon icon-class="validCode" class="input-icon" /></template>
            </el-input>
            <div class="login-code" @click="getCode">
              <img :src="codeUrl" class="login-code-img" />
            </div>
          </div>
        </el-form-item>

        <div class="remember-box">
          <el-checkbox v-model="loginForm.rememberMe">{{ proxy.$t('login.rememberPassword') }}</el-checkbox>
          <router-link v-if="register" class="link-type" to="/register">
            {{ proxy.$t('login.switchRegisterPage') }}
          </router-link>
        </div>

        <el-button size="large" type="primary" class="login-btn" @click.prevent="handleLogin">
          {{ proxy.$t('login.login') }}
        </el-button>
        <!-- <div class="social-login">
          <div class="divider"><span>Or sign in with</span></div>
          <div class="social-icons">
            <el-button circle size="large" @click="doSocialLogin('wechat')">
              <svg-icon icon-class="wechat" />
            </el-button>
            <el-button circle size="large" @click="doSocialLogin('github')">
              <svg-icon icon-class="github" />
            </el-button>
          </div>
        </div> -->
      </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background: #f0f2f5;
  background-size: cover;
  position: relative;
}

.login-box {
  display: flex;
  width: 900px;
  height: 520px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(18, 52, 99, 0.08); 
  overflow: hidden;
  z-index: 1;

  @media (max-width: 900px) {
    width: 90%;
    height: auto;
    .login-left { display: none; }
    .login-form { width: 100%; padding: 40px; }
  }
}

.login-left {
  width: 50%;
  background: #fdfdfd;
  display: flex;
  justify-content: center;
  align-items: center;
  border-right: 1px solid #f2f2f2;

  img {
    width: 75%;
    transition: transform 0.4s ease-in-out;
  }
}

.login-form {
  width: 50%;
  padding: 40px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .welcome-text {
    font-size: 20px;
    font-weight: bold;
    color: #34495e;
    margin-bottom: 30px;
    letter-spacing: 0.5px;
  }

  :deep(.el-input__wrapper) {
    box-shadow: none;
    background: #f5f7fa;
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 1px 11px;
    transition: all 0.3s;
    &.is-focus {
      background: #fff;
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }
  }
  
  :deep(.el-input__inner) {
    height: 42px;
  }

  .input-icon {
    width: 16px;
    height: 16px;
    color: #909399;
    margin-left: 5px;
  }
}

.captcha-box {
  display: flex;
  width: 100%;
  gap: 15px;
  
  .captcha-input { flex: 1; }
  
  .login-code {
    width: 120px;
    height: 44px;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid #eee;
    img { width: 100%; height: 100%; object-fit: cover; }
  }
}

.remember-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  
  .link-type {
    font-size: 14px;
    color: var(--el-color-primary);
    text-decoration: none;
    transition: opacity 0.2s;
    &:hover { opacity: 0.8; }
  }
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  letter-spacing: 1px;
  border-radius: 8px;
  background: #3b82f6; 
  border: none;
  font-weight: 500;
  margin-bottom: 20px;
  &:hover {
    background: #2563eb;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }
}

.social-login {
  .divider {
    position: relative;
    text-align: center;
    margin-bottom: 20px;
    
    &::before {
      content: "";
      position: absolute;
      left: 0; top: 50%;
      width: 100%; height: 1px;
      background: #eee;
    }
    
    span {
      position: relative;
      background: #fff;
      padding: 0 12px;
      color: #bbb;
      font-size: 12px;
    }
  }
  
  .social-icons {
    display: flex;
    justify-content: center;
    gap: 20px;
    
    .el-button {
      border: 1px solid #eee;
      color: #666;
      transition: all 0.3s;
    }
  }
}
</style>

<script setup lang="ts">
import { getCodeImg } from '@/api/login';
import { authRouterUrl } from '@/api/system/social/auth';
import { useUserStore } from '@/store/modules/user';
import { LoginData } from '@/api/types';
import { HttpStatus } from '@/enums/RespEnum';
import { useI18n } from 'vue-i18n';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const userStore = useUserStore();
const router = useRouter();
const { t } = useI18n();

const loginForm = ref<LoginData>({
  username: '',
  password: '',
  rememberMe: false,
  code: '',
  uuid: ''
} as LoginData);

const loginRules: ElFormRules = {
  username: [{ required: true, trigger: 'blur', message: t('login.rule.username.required') }],
  password: [{ required: true, trigger: 'blur', message: t('login.rule.password.required') }],
  code: [{ required: true, trigger: 'change', message: t('login.rule.code.required') }]
};

const codeUrl = ref('');
// 验证码开关
const captchaEnabled = ref(true);

// 注册开关
const register = ref(false);
const redirect = ref('/');
const loginRef = ref<ElFormInstance>();

watch(
  () => router.currentRoute.value,
  (newRoute: any) => {
    redirect.value = newRoute.query && newRoute.query.redirect && decodeURIComponent(newRoute.query.redirect);
  },
  { immediate: true }
);

const handleLogin = () => {
  loginRef.value?.validate(async (valid: boolean, fields: any) => {
    if (valid) {
      // 勾选了需要记住密码设置在 localStorage 中设置记住用户名和密码
      if (loginForm.value.rememberMe) {
        localStorage.setItem('username', String(loginForm.value.username));
        localStorage.setItem('password', String(loginForm.value.password));
        localStorage.setItem('rememberMe', String(loginForm.value.rememberMe));
      } else {
        // 否则移除
        localStorage.removeItem('username');
        localStorage.removeItem('password');
        localStorage.removeItem('rememberMe');
      }
      // 调用action的登录方法
      try{
        await userStore.login(loginForm.value);
        const redirectUrl = redirect.value || '/';
        await router.push(redirectUrl);
      }
      catch(err){
        // 重新获取验证码
        if (captchaEnabled.value) {
          await getCode();
        }
      }
    } else {
      console.log('error submit!', fields);
    }
  });
};

/**
 * 获取验证码
 */
const getCode = async () => {
  const res = await getCodeImg();
  const { code,data } = res;
  if(code===HttpStatus.OK&&!data)captchaEnabled.value = false;
  else{
    loginForm.value.code = '';
    codeUrl.value = 'data:image/gif;base64,' + data.img;
    loginForm.value.uuid = data.uuid;
  }
};

const getLoginData = () => {
  const username = localStorage.getItem('username');
  const password = localStorage.getItem('password');
  const rememberMe = localStorage.getItem('rememberMe');
  loginForm.value = {
    username: username === null ? String(loginForm.value.username) : username,
    password: password === null ? String(loginForm.value.password) : String(password),
    rememberMe: rememberMe === null ? false : Boolean(rememberMe)
  } as LoginData;
};
const doSocialLogin = (type: string) => {
  authRouterUrl(type).then((res: any) => {
    if (res.code === HttpStatus.OK) {
      // 获取授权地址跳转
      window.location.href = res.data;
    } else {
      ElMessage.error(res.msg);
    }
  });
};

onMounted(() => {
  getCode();
  getLoginData();
});
</script>