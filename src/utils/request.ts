import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useUserStore } from '@/store/modules/user';
import { getToken } from '@/utils/auth';
import { tansParams, blobValidate } from '@/utils/ruoyi';
import { HttpStatus } from '@/enums/RespEnum';
import { errorCode } from '@/utils/errorCode';
import { getLanguage } from '@/lang';
import router from '@/router';
import {saveAs} from '@/utils/download'
// 是否显示重新登录
export const isRelogin = { show: false };
export const globalHeaders = () => {
  return {
    Authorization: 'Bearer ' + getToken()
  };
};

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8';
// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 50000,
  transitional: {
    // 超时错误更明确
    clarifyTimeoutError: true
  }
});

const lastRequest = {
  url: '',
  data: '',
  time: 0
};

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 对应国际化资源文件后缀
    config.headers['Content-Language'] = getLanguage();

    const isToken = config.headers?.isToken === false;
    if (getToken() && !isToken) {
      config.headers['Authorization'] = 'Bearer ' + getToken(); // 让每个请求携带自定义token 请根据实际情况自行修改
    }
    // get请求映射params参数
    if (config.method === 'get' && config.params) {
      let url = config.url + '?' + tansParams(config.params);
      url = url.slice(0, -1);
      config.params = {};
      config.url = url;
    }
    
    // 是否需要防止数据重复提交
    const isRepeatSubmit = config.headers?.repeatSubmit === false;
    
    if (!isRepeatSubmit && (config.method === 'post')) {
      const requestObj = {
        url: config.url || '',
        data: typeof config.data === 'object' ? JSON.stringify(config.data) : (config.data || ''),
        time: new Date().getTime()
      };
      
      const interval = 500; // 间隔时间(ms)
      if (
        requestObj.data === lastRequest.data && 
        requestObj.url === lastRequest.url && 
        requestObj.time - lastRequest.time < interval
      ) {
        const message = '数据正在处理，请勿重复提交';
        return Promise.reject(new Error(message));
      } 
      
      // 更新内存变量
      lastRequest.url = requestObj.url;
      lastRequest.data = requestObj.data;
      lastRequest.time = requestObj.time;
    }
    // FormData数据去请求头Content-Type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (res: AxiosResponse) => {
    // 未设置状态码则默认成功状态
    const code = res.data.code || HttpStatus.OK;
    // 获取错误信息
    const msg = errorCode[code] || res.data.msg || errorCode['default'];
    // 二进制数据则直接返回
    if (res.request.responseType === 'blob' || res.request.responseType === 'arraybuffer') {
      return res.data;
    }
    if (code === HttpStatus.UNAUTHORIZED) {
      if (!isRelogin.show) {
        isRelogin.show = true;
        ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          isRelogin.show = false;
          useUserStore().logout().then(() => {
            router.replace({
              path: '/login',
              query: {
                redirect: encodeURIComponent(router.currentRoute.value.fullPath || '/')
              }
            })
          });
        }).catch(() => {
          isRelogin.show = false;
        });
      }
      return Promise.reject('无效的会话，或者会话已过期，请重新登录。');
    } else if (code === HttpStatus.SERVER_ERROR) {
      ElMessage({ message: msg, type: 'error' });
      return Promise.reject(new Error(msg));
    } else if (code !== HttpStatus.OK) {
      ElNotification.error({ title: msg });
      return Promise.reject('error');
    } else {
      return Promise.resolve(res.data);
    }
  },
  (error: any) => {
    let { message } = error;
    if (message == 'Network Error') {
      message = '后端接口连接异常';
    } else if (message.includes('timeout')) {
      message = '系统接口请求超时';
    } else if (message.includes('Request failed with status code')) {
      message = '系统接口' + message.substr(message.length - 3) + '异常';
    }
    ElMessage({ message: message, type: 'error', duration: 5 * 1000 });
    return Promise.reject(error);
  }
);
export function download(url: string, params: any, fileName: string) {
  const downloadLoadingInstance = ElLoading.service({ 
    text: '正在下载数据，请稍候', 
    background: 'rgba(0, 0, 0, 0.7)' 
  });

  return service
    .post(url, params, {
      transformRequest: [(params: any) => tansParams(params)],
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      responseType: 'blob'
    })
    .then(async (resp: any) => {
      const isValid = blobValidate(resp);
      if (isValid) {
        const blob = new Blob([resp]);
        saveAs(blob, fileName);
      } else {
        // 处理业务错误（后端返回 JSON 错误信息）
        const resText = await new Blob([resp]).text();
        const rspObj = JSON.parse(resText);
        const errMsg = errorCode[rspObj.code] || rspObj.msg || errorCode['default'];
        ElMessage.error(errMsg);
      }
    })
    .catch((error: any) => {
      console.error(error);
      ElMessage.error('下载文件出现错误！');
    })
    .finally(() => {
      downloadLoadingInstance.close();
    });
}
// 导出 axios 实例
export default service;
