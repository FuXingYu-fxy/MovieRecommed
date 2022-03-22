# 毕业设计的后端, 正在开发中
第三方包的bug, 为了解决此bug, 修改了源码
* ~~`mysql`中使用了一个模块**SqlString** 导入了另一个模块**sqlstring**, 但是`windows`系统对文件名大小写不敏感, 所以`webpack`打包时会发现两个同名模块, 并且打包后的代码无法运行。`linux`系统严格区分大小写, 不会出现上诉问题~~是因为webpack中配置了 resolve.preferRelative: true的原因