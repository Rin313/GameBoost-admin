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



import {TaskQuery } from './types';
/**
 * 获取任务列表
 */
export function listTasks(query: TaskQuery) {
  return request({
    url: '/order/listTasks',
    method: 'get',
    params: query
  });
}

export function listTasksSelf(query: TaskQuery) {
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