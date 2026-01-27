import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { BizLogQuery, BizLogVO } from './types';

export const listDeposit = (query: BizLogQuery): AxiosPromise<BizLogVO> => {
  return request({
    url: '/bizLog/listDeposit',
    method: 'get',
    params: query
  });
};
export const listCredit = (query: BizLogQuery): AxiosPromise<BizLogVO> => {
  return request({
    url: '/bizLog/listCredit',
    method: 'get',
    params: query
  });
};
export const listDepositSelf = (query: BizLogQuery): AxiosPromise<BizLogVO> => {
  return request({
    url: '/bizLog/listDepositSelf',
    method: 'get',
    params: query
  });
};
export const listCreditSelf = (query: BizLogQuery): AxiosPromise<BizLogVO> => {
  return request({
    url: '/bizLog/listCreditSelf',
    method: 'get',
    params: query
  });
};