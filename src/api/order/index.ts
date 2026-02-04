import request from '@/utils/request';
import { OrderInsertForm, OrderQuery, OrderUpdateForm, OrderVO } from './types';

/**
 * 查询订单列表
 */
export function listOrder(query: OrderQuery) {
  return request({
    url: '/order/list',
    method: 'get',
    params: query
  });
}

/**
 * 新增订单
 */
export function addOrder(data: OrderInsertForm) {
  return request({
    url: '/order/insert',
    method: 'post',
    data: data
  });
}

/**
 * 修改订单
 */
export function updateOrder(data: OrderUpdateForm) {
  return request({
    url: '/order/update',
    method: 'post',
    data: data
  });
}



/**
 * 获取任务列表
 */
export function listTasks(query) {
  return request({
    url: '/order/listTasks',
    method: 'get',
    params: query
  });
}

export function listTasksSelf(query) {
  return request({
    url: '/order/listTasksSelf',
    method: 'get',
    params: query
  });
}

/**
 * 完成任务
 */
export function finishTask(id: number) {
  return request({
    url: '/order/finish',
    method: 'post',
    params: { id }
  });
}

export function insertTask(data:any){
    return request({
        url: '/order/insertTask',
        method: 'post',
        data: data
    })
}

export function transfer(data:any){
    return request({
        url: '/order/transfer',
        method: 'post',
        data: data
    })
}

export function submit(data){
    return request({
        url: '/order/submit',
        method: 'post',
        data: data,
        headers: {
        'Content-Type': 'multipart/form-data'
        }
  });
}
export function withdrawal(data){
    return request({
        url: '/order/withdrawal',
        method: 'post',
        data: data
  });
}

// 获取数据分析总览
export function getAnalysisOverview(params) {
  return request({
    url: '/order/analysis/overview',
    method: 'get',
    params
  })
}

// 获取时间趋势数据
export function getTimeTrend(params) {
  return request({
    url: '/order/analysis/trend',
    method: 'get',
    params
  })
}

// 按业务类型统计
export function getByOrderType(params) {
  return request({
    url: '/order/analysis/by-order-type',
    method: 'get',
    params
  })
}

// 按代练统计
export function getByUser(params) {
  return request({
    url: '/order/analysis/by-user',
    method: 'get',
    params
  })
}

// 获取特定代练详细统计
export function getUserDetail(userId, params) {
  return request({
    url: `/order/analysis/user/${userId}`,
    method: 'get',
    params
  })
}