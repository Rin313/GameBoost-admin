// 查询参数
export interface OrderQuery {
  pageNum: number;
  pageSize: number;
  orderNo?: string;
  orderType?: string;
  beginTime?: string;
  endTime?: string;
}

// 订单VO
export interface OrderVO {
  id: number;
  orderNo: string;
  customerAccount: string;
  customerPassword: string;
  deadline: string;
  amount: number;
  requirement: string;
  orderType: string;
  status: string;
  createTime: string;
  remark: string;
}

// 新增表单
export interface OrderInsertForm {
  orderNo?: string;
  customerAccount?: string;
  customerPassword?: string;
  deadline?: string;
  amount?: number;
  requirement?: string;
  orderType?: string;
  remark?: string;
}

// 修改表单
export interface OrderUpdateForm {
  id?: number;
  orderNo?: string;
  customerAccount?: string;
  customerPassword?: string;
  deadline?: string;
  amount?: number;
  requirement?: string;
  remark?: string;
  orderType?: string;
  status?: string;
}

// 通用表单类型
export type OrderForm = OrderInsertForm | OrderUpdateForm;


// src/api/order/tasks/types.ts
export interface OrderTasks {
  id: number;
  orderId: number;
  screenshots: {
    '账号资产-前'?: string;
    '账号资产-后'?: string;
    '仓库对比-前'?: string;
    '仓库对比-后'?: string;
    '老板结单图'?: string;
  };
  status: string;
  createBy: number;
  createTime: string;
}

export interface TaskQuery {
  orderId?: number;
  pageNum: number;
  pageSize: number;
}

// 扩展类型，包含用户信息
export interface TaskWithUser extends OrderTasks {
  username?: string;
  realName?: string;
  phonenumber?: string;
}