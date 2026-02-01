import request from '@/utils/request';
import { ConfigForm, ConfigQuery, ConfigVO } from './types';
import { AxiosPromise } from 'axios';

// 查询参数列表
export function listConfig(query: ConfigQuery): AxiosPromise<ConfigVO[]> {
  return request({
    url: '/system/config/list',
    method: 'get',
    params: query
  });
}

// 根据参数键名查询参数值
export function getConfigKey(configKey: string): AxiosPromise<string> {
  return request({
    url: '/system/config/' + configKey,
    method: 'get'
  });
}

// 新增参数配置
export function addConfig(data: ConfigForm) {
  return request({
    url: '/system/config/insert',
    method: 'post',
    data: data
  });
}

// 修改参数配置
export function updateConfig(data: ConfigForm) {
  return request({
    url: '/system/config/update',
    method: 'post',
    data: data
  });
}

// 删除参数配置
export function delConfig(configId: string | number | Array<string | number>) {
  return request({
    url: '/system/config/' + configId,
    method: 'post'
  });
}
