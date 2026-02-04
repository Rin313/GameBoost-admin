import request from '@/utils/request';

export function list(query) {
  return request({
    url: '/withdrawal/list',
    method: 'get',
    params: query
  });
}

export function ook(ids:any) {
  return request({
    url: '/withdrawal/ok',
    method: 'post',
    data: ids
  });
}

export function finish(ids:any) {
  return request({
    url: '/withdrawal/finish',
    method: 'post',
    data: ids
  });
}
export function reject(data) {
  return request({
    url: '/withdrawal/reject',
    method: 'post',
    data: data
  });
}
// /**
//  * 修改订单
//  */
// export function updateOrder(data: OrderUpdateForm) {
//   return request({
//     url: '/order/update',
//     method: 'post',
//     data: data
//   });
// }



// /**
//  * 获取任务列表
//  */
// export function listTasks(query) {
//   return request({
//     url: '/order/listTasks',
//     method: 'get',
//     params: query
//   });
// }

// export function listTasksSelf(query) {
//   return request({
//     url: '/order/listTasksSelf',
//     method: 'get',
//     params: query
//   });
// }

// /**
//  * 完成任务
//  */
// export function finishTask(id: number) {
//   return request({
//     url: '/order/finish',
//     method: 'post',
//     params: { id }
//   });
// }

// export function insertTask(data:any){
//     return request({
//         url: '/order/insertTask',
//         method: 'post',
//         data: data
//     })
// }

// export function transfer(data:any){
//     return request({
//         url: '/order/transfer',
//         method: 'post',
//         data: data
//     })
// }

// export function submit(data){
//     return request({
//         url: '/order/submit',
//         method: 'post',
//         data: data,
//         headers: {
//         'Content-Type': 'multipart/form-data'
//         }
//   });
// }
// export function withdrawal(data){
//     return request({
//         url: '/order/withdrawal',
//         method: 'post',
//         data: data
//   });
// }