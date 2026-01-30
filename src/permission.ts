import router from './router';
import { getToken } from '@/utils/auth';
import { isHttp, isPathMatch } from '@/utils/validate';
import { isRelogin } from '@/utils/request';
import { useUserStore } from '@/store/modules/user';
import { useSettingsStore } from '@/store/modules/settings';
import { usePermissionStore } from '@/store/modules/permission';
import { ElMessage } from 'element-plus/es';

const whiteList = ['/login', '/register', '/social-callback', '/register*', '/register/*'];

const isWhiteList = (path: string) => {
  return whiteList.some((pattern) => isPathMatch(pattern, path));
};

router.beforeEach(async (to, from, next) => {
  if (getToken()) {
    to.meta.title && useSettingsStore().setTitle(to.meta.title as string);
    /* has token*/
    if (to.path === '/login') {
      next({ path: '/' });
    } 
    else if(to.path ==='/'){
        //直接同步了下面的代码块//TODO：增加是否使用首页的选项
        if (useUserStore().roles.length === 0) {
        isRelogin.show = true;
        // 判断当前用户是否已拉取完user_info信息
        try {
            const res = await useUserStore().getInfo();
            isRelogin.show = false;
            const accessRoutes = await usePermissionStore().generateRoutes();
            // 根据roles权限生成可访问的路由表
            accessRoutes.forEach((route) => {
                if (!isHttp(route.path)) {
                router.addRoute(route); // 动态添加可访问路由表
                }
            });
            let route = undefined;

            for (const r of accessRoutes) {
                let tpath = r.path==='/'?r.path:r.path+'/';
                if (r.children) {
                    for (const child of r.children) {
                        tpath += child.path;
                        if (child.children) {
                            // 继续处理
                        } else {
                            route = child;
                            route.path = tpath;
                            break; // 跳出内层循环
                        }
                    }
                    if (route) break; // 跳出外层循环
                } else {
                    route = r;
                    route.path = tpath;
                    break; // 跳出外层循环
                }
            }
            router.push(route.path)
            // console.log(accessRoutes)
            // console.log(to)
            // console.log(route)
            // console.log(route.path)
        } catch (err) {
            await useUserStore().logout();
            ElMessage.error(err);
            next({ path: '/' });
        }
      } else {
        next();
      }

    }
    else if (isWhiteList(to.path)) {
      next();
    } else {
      if (useUserStore().roles.length === 0) {
        isRelogin.show = true;
        // 判断当前用户是否已拉取完user_info信息
        try {
            const res = await useUserStore().getInfo();
            isRelogin.show = false;
            const accessRoutes = await usePermissionStore().generateRoutes();
            // 根据roles权限生成可访问的路由表
            accessRoutes.forEach((route) => {
                if (!isHttp(route.path)) {
                router.addRoute(route); // 动态添加可访问路由表
                }
            });
            // @ts-expect-error hack方法 确保addRoutes已完成
            next({ path: to.path, replace: true, params: to.params, query: to.query, hash: to.hash, name: to.name as string }); // hack方法 确保addRoutes已完成
        } catch (err) {
            await useUserStore().logout();
            ElMessage.error(err);
            next({ path: '/' });
        }
      } else {
        next();
      }
    }
  } else {
    // 没有token
    if (isWhiteList(to.path)) {
      // 在免登录白名单，直接进入
      next();
    } else {
      const redirect = encodeURIComponent(to.fullPath || '/');
      next(`/login?redirect=${redirect}`); // 否则全部重定向到登录页
    }
  }
});