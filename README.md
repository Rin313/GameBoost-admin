```bash
# 安装依赖
npm install --registry=https://registry.npmmirror.com

# 启动服务
npm run dev

# 构建生产环境
npm run build
```

TODO
vue-cropper


我正在开发一个使用vue3的管理端项目，我需要设计一个页面分配方案：
1. 对于不同角色（role）、不同权限（permission）的用户，显示的页面列表是不相同的
2. 我需要考虑是否添加两个directive`hasPermis`、`hasRoles`来更好地定制页面
3. 对于一个功能定位相同，但需要针对不同角色/权限进行额外处理的页面，逻辑一旦堆积太多，复杂度上升，维护起来会非常困难；
如果拆分出多个页面，会出现页面同名的问题，在分配时容易混淆。