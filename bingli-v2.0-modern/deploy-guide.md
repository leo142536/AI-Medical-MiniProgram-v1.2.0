# 🚀 AI病例管理小程序 - 云开发部署指南

## 📋 前置准备

### 1. 注册微信小程序
- 前往 [微信公众平台](https://mp.weixin.qq.com/) 注册小程序
- 获取 AppID 和 AppSecret
- 开通云开发服务

### 2. 安装开发工具
- 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 版本要求：最新稳定版

### 3. 环境要求
- Node.js 14+ 
- npm 6+

## 🛠️ 部署步骤

### 第一步：项目配置

1. **配置项目信息**
   ```bash
   # 1. 修改 project.config.json 中的 appid
   {
     "appid": "你的小程序AppID"
   }
   
   # 2. 修改 app.js 中的云开发环境ID
   wx.cloud.init({
     env: 'your-env-id', // 替换为你的环境ID
     traceUser: true
   })
   ```

### 第二步：开通云开发

1. **在微信开发者工具中开通云开发**
   - 打开小程序项目
   - 点击工具栏中的"云开发"
   - 点击"开通"按钮
   - 选择环境模式：建议选择"按量付费"（有免费额度）
   - 设置环境名称，例如：`family-medical-env`

2. **记录环境信息**
   ```
   环境名称：family-medical-env
   环境ID：云开发控制台会显示
   ```

### 第三步：创建云数据库

1. **在云开发控制台创建集合**
   ```bash
   # 需要创建的集合：
   - health_reminders  # 健康提醒
   - user_settings     # 用户设置  
   - file_records      # 文件记录
   ```

2. **配置数据库权限**
   ```json
   {
     "read": "auth",
     "write": "auth"
   }
   ```

3. **初始化数据库**
   - 在云开发控制台的数据库页面打开"数据库指令"
   - 复制 `scripts/init-database.js` 中的代码执行
   ```javascript
   // 执行初始化
   initDatabase()
   ```

### 第四步：部署云函数

1. **安装云函数依赖**
   ```bash
   cd cloudfunctions/database
   npm install
   ```

2. **上传云函数**
   - 在微信开发者工具中右键点击 `cloudfunctions/database`
   - 选择"上传并部署：云端安装依赖"
   - 等待部署完成

3. **测试云函数**
   ```javascript
   // 在云开发控制台测试
   {
     "action": "list",
     "collection": "health_reminders"
   }
   ```

### 第五步：配置云存储

1. **创建云存储目录结构**
   ```
   /images/           # 图片文件
   /documents/        # 文档文件
   /medical/          # 病历相关文件
   /general/          # 通用文件
   ```

2. **设置安全规则**
   ```json
   {
     "read": "auth",
     "write": "auth"
   }
   ```

### 第六步：配置小程序权限

1. **设置服务器域名**
   在小程序管理后台 → 开发 → 开发设置中添加：
   ```
   request合法域名：
   - https://api.weixin.qq.com
   - https://云开发环境ID.tcb.qcloud.la
   
   uploadFile合法域名：
   - https://云开发环境ID.tcb.qcloud.la
   
   downloadFile合法域名：  
   - https://云开发环境ID.tcb.qcloud.la
   ```

2. **配置功能页面**
   ```json
   {
     "pages": [
       "pages/record/record",
       "pages/family/family", 
       "pages/reminder/reminder",
       "pages/profile/profile"
     ]
   }
   ```

## 🧪 测试验证

### 1. 功能测试清单

- [ ] 用户授权登录
- [ ] 健康提醒增删改查
- [ ] 用户设置同步
- [ ] 文件上传下载
- [ ] 数据缓存机制
- [ ] 离线数据同步

### 2. 性能测试

```javascript
// 测试数据库响应时间
console.time('database_query')
await cloudDB.getReminders()
console.timeEnd('database_query')

// 测试文件上传
console.time('file_upload')
await cloudDB.uploadFile(filePath, fileName)
console.timeEnd('file_upload')
```

### 3. 错误处理测试

- 网络断开时的离线处理
- 权限被拒绝时的降级处理
- 云函数调用失败的重试机制

## 📊 监控和维护

### 1. 云开发控制台监控

- **数据库**：查看读写次数、存储量
- **云函数**：查看调用次数、执行时间
- **云存储**：查看存储量、流量使用

### 2. 性能优化建议

```javascript
// 1. 数据缓存优化
const cache = new Map()
const CACHE_TIMEOUT = 5 * 60 * 1000

// 2. 批量操作优化
const batchSize = 20
const chunks = this.chunkArray(data, batchSize)

// 3. 索引优化
db.collection('health_reminders').createIndex({
  keys: { _openid: 1, status: 1, time: 1 }
})
```

### 3. 成本控制

- **免费额度监控**：定期检查使用量
- **数据清理**：定期清理过期数据
- **索引优化**：避免全表扫描

## 💰 成本估算

### 免费额度（每月）
- 数据库读写：5万次
- 云存储：5GB
- 云函数调用：10万次
- CDN流量：5GB

### 预估使用量
- 日活用户：100人
- 每日数据库操作：1000次
- 每月总计：3万次（在免费额度内）

## 🔧 故障排除

### 常见问题

1. **云函数调用失败**
   ```javascript
   // 检查环境ID是否正确
   // 检查权限配置
   // 查看云函数日志
   ```

2. **数据库连接失败**
   ```javascript
   // 检查集合名称
   // 检查数据权限
   // 验证openid获取
   ```

3. **文件上传失败**
   ```javascript
   // 检查文件大小限制
   // 检查云存储权限
   // 验证文件路径
   ```

### 调试技巧

```javascript
// 开启详细日志
console.log('云函数调用参数:', params)
console.log('返回结果:', result)

// 使用云开发调试器
wx.cloud.callFunction({
  name: 'database',
  data: testData
}).then(console.log).catch(console.error)
```

## 🚀 上线发布

### 1. 代码审查清单

- [ ] 移除测试数据和调试代码
- [ ] 确认生产环境配置
- [ ] 检查错误处理完整性
- [ ] 验证用户权限控制

### 2. 提交审核

1. 在微信开发者工具中点击"上传"
2. 填写版本号和项目备注
3. 在小程序管理后台提交审核
4. 等待审核通过后发布

### 3. 监控上线效果

- 关注云开发使用量
- 监控用户反馈
- 及时处理异常情况

## 📞 技术支持

- 微信开发者社区：https://developers.weixin.qq.com/community/
- 云开发文档：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/
- 问题反馈：通过小程序内置反馈功能

---

**祝您部署顺利！** 🎉

如有问题，请参考故障排除章节或联系技术支持。 