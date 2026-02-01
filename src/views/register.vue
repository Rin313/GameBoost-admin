<template>
  <div class="login-wrapper">
    <div class="login-box">
      <div class="login-left">
        <img src="../assets/images/Innovation-bro.png"/>
      </div>
      <el-form ref="registerRef" :model="registerForm" :rules="registerRules" class="login-form">
        <div class="welcome-text">
          {{ proxy.$t('register.welcome') }}
        </div>

        <!-- 第一步：账号基础信息 -->
        <div v-show="step === 1">
          <el-form-item prop="username">
            <el-input 
              v-model="registerForm.username" 
              size="large" 
              :placeholder="proxy.$t('register.username')"
            >
              <template #prefix><svg-icon icon-class="user" class="input-icon" /></template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              size="large"
              show-password
              :placeholder="proxy.$t('register.password')"
            >
              <template #prefix><svg-icon icon-class="password" class="input-icon" /></template>
            </el-input>
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              size="large"
              show-password
              :placeholder="proxy.$t('register.confirmPassword')"
              @keyup.enter="handleNextStep"
            >
              <template #prefix><svg-icon icon-class="password" class="input-icon" /></template>
            </el-input>
          </el-form-item>
        </div>

        <!-- 第二步：新增实名信息 + 验证码 -->
        <div v-show="step === 2">
          <!-- 新增：姓名 -->
          <el-form-item prop="realName">
            <el-input v-model="registerForm.realName" size="large" placeholder="请输入真实姓名">
              <template #prefix><el-icon class="input-icon"><User /></el-icon></template>
            </el-input>
          </el-form-item>
          
          <!-- 新增：手机号 -->
          <el-form-item prop="phonenumber">
            <el-input v-model="registerForm.phonenumber" size="large" placeholder="请输入手机号码">
              <template #prefix><el-icon class="input-icon"><Iphone /></el-icon></template>
            </el-input>
          </el-form-item>

          <!-- 新增：身份证号 -->
          <el-form-item prop="idCard">
            <el-input v-model="registerForm.idCard" size="large" placeholder="请输入身份证号">
              <template #prefix><el-icon class="input-icon"><Postcard /></el-icon></template>
            </el-input>
          </el-form-item>

          <!-- 验证码 (移动到此处) -->
          <el-form-item v-if="captchaEnabled" prop="code">
            <div class="captcha-box">
              <el-input
                v-model="registerForm.code"
                size="large"
                :placeholder="proxy.$t('register.code')"
                class="captcha-input"
                @keyup.enter="handleRegister"
              >
                <template #prefix><svg-icon icon-class="validCode" class="input-icon" /></template>
              </el-input>
              <div class="login-code" @click="getCode">
                <img :src="codeUrl" class="login-code-img" />
              </div>
            </div>
          </el-form-item>

          <!-- 新增：协议勾选 -->
          <!-- <el-form-item prop="isAgree" style="margin-bottom: 10px;">
            <el-checkbox v-model="agree">
              我已阅读并同意
              <span class="link-type" @click.stop="showAgreement">《代练合伙人协议》</span>
            </el-checkbox>
          </el-form-item> -->
        </div>

        <!-- 底部操作区 -->
        <div class="remember-box" style="justify-content: flex-end; margin-bottom: 15px;" v-show="step === 1">
          <router-link v-if="login" class="link-type" :to="'/login'">
            {{ proxy.$t('register.switchLoginPage') }}
          </router-link>
        </div>

        <!-- 按钮组 -->
        <div v-if="step === 1">
          <el-button size="large" type="primary" class="login-btn" @click="handleNextStep">
            下一步
          </el-button>
        </div>
        
        <div v-else style="display: flex; gap: 10px;">
          <el-button size="large" type="primary" class="login-btn" style="width: 30%" @click="step = 1">
            上一步
          </el-button>
          <el-button 
            size="large" 
            type="primary" 
            class="login-btn" 
            style="width: 70%" 
            @click.prevent="handleRegister"
          >
            {{ proxy.$t('register.register') }}
          </el-button>
        </div>

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
import { getCodeImg, applicate} from '@/api/login';
import { ApplicateForm } from '@/api/types';
import { HttpStatus } from '@/enums/RespEnum';
import { useI18n } from 'vue-i18n';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const router = useRouter();
const login=ref(false)
const { t } = useI18n();
// const agree=ref(false);
const step=ref(1);
const registerForm = ref<ApplicateForm>({
  username: '',
  password: '',
  confirmPassword: '',
  code: '',
  uuid: '',
  phonenumber:'',
  idCard:'',
  realName:''
});

const equalToPassword = (rule: any, value: string, callback: any) => {
  if (registerForm.value.password !== value) {
    callback(new Error(t('register.rule.confirmPassword.equalToPassword')));
  } else {
    callback();
  }
};
// const validateAgree = (rule: any, value: any, callback: any) => {
//   // 如果值为 true，校验通过
//   if (value === true) {
//     callback();
//   } else {
//     // 否则报错
//     callback(new Error(t('register.rule.isAgree.required'))); 
//   }
// };

const registerRules: ElFormRules = {
    username: [
        { required: true, trigger: 'blur', message: t('register.rule.username.required') },
        { min: 1, max: 30, message: t('register.rule.username.length', { min: 1, max: 30 }), trigger: 'blur' }
    ],
    password: [
        { required: true, trigger: 'blur', message: t('register.rule.password.required') },
        { min: 5, max: 30, message: t('register.rule.password.length', { min: 5, max: 30 }), trigger: 'blur' },
        { pattern: /^[^<>"'|\\]+$/, message: t('register.rule.password.pattern', { strings: '< > " \' \\ |' }), trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, trigger: 'blur', message: t('register.rule.confirmPassword.required') },
        { required: true, validator: equalToPassword, trigger: 'blur' }
    ],
    code: [{ required: true, trigger: 'change', message: t('register.rule.code.required') }],
    realName: [
        { required: true, trigger: 'blur', message: t('register.rule.realName.required') },
    ],
    phonenumber: [
        { required: true, trigger: 'blur', message: t('register.rule.phonenumber.required') },
        { 
        pattern: /^\d{7,}$/, 
        message: t('register.rule.phonenumber.pattern'),
        trigger: 'blur' 
        }
    ],
    idCard: [
        { required: true, trigger: 'blur', message: t('register.rule.idCard.required') },
        { 
        pattern: /^[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|10|11|12)(?:0[1-9]|[1-2]\d|30|31)\d{3}[\dXx]$/,
        message: t('register.rule.idCard.pattern'),
        trigger: 'blur' 
        }
    ],
    //有样式Bug：触发校验失败后，即使勾选使得isAgree为true，红色提示文字也不会消失
    // isAgree: [
    //     { 
    //     validator: validateAgree, 
    //     trigger: 'change' 
    //     }
    // ]
};
const codeUrl = ref('');
const captchaEnabled = ref(true);
const registerRef = ref<ElFormInstance>();

const handleRegister = () => {
//   if (!agree.value) return proxy.$modal.msgWarning("请阅读并勾选协议");
  registerRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      try{
        await applicate(registerForm.value);
        proxy?.$modal.alertSuccess('申请成功');
        await router.push('/login');
      }
      catch(err){
        if (captchaEnabled.value) {
          getCode();
        }
      }
    }
  });
};
const handleNextStep=()=>{
    registerRef.value?.validateField(['username', 'password', 'confirmPassword'],async (valid: boolean) => {
        if (valid) {
            step.value = 2;
        }
    });

}
const getCode = async () => {
  const res = await getCodeImg();
  const { code,data } = res;
  if(code===HttpStatus.OK&&!data)captchaEnabled.value = false;
  else {
    registerForm.value.code = '';
    codeUrl.value = 'data:image/gif;base64,' + data.img;
    registerForm.value.uuid = data.uuid;
  }
};
onMounted(() => {
  getCode();
});
</script>