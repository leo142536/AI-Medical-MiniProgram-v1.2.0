# AI模型配置说明

## 概述

本项目支持多种AI模型进行病例分析，包括：
- GPT-4 医疗助手
- Claude 健康分析师  
- Gemini 医疗智能
- 百度文心医疗大模型

## 配置步骤

### 1. 编辑配置文件

打开 `utils/aiConfig.js` 文件，将相应的API密钥替换为真实密钥：

```javascript
const AI_MODELS_CONFIG = {
  'gpt4': {
    apiKey: 'sk-your-actual-openai-api-key', // 替换这里
    // ... 其他配置
  },
  'claude': {
    apiKey: 'sk-ant-your-actual-anthropic-api-key', // 替换这里
    // ... 其他配置
  },
  // ... 其他模型配置
};
```

### 2. 获取API密钥

#### OpenAI GPT-4
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册账号并完成验证
3. 进入 API Keys 页面创建新的API密钥
4. 确保账户有足够的余额或绑定支付方式

#### Anthropic Claude
1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 注册账号并申请API访问权限
3. 创建API密钥
4. 查看使用限制和定价

#### Google Gemini
1. 访问 [Google AI Studio](https://makersuite.google.com/)
2. 创建项目并启用Generative AI API
3. 生成API密钥
4. 配置使用配额

#### 百度文心一言
1. 访问 [百度智能云](https://cloud.baidu.com/)
2. 开通文心一言服务
3. 获取API Key和Secret Key
4. 配置调用权限

### 3. 安全注意事项

⚠️ **重要提醒**：
- 不要将API密钥提交到代码仓库
- 建议使用环境变量或配置文件管理密钥
- 定期轮换API密钥
- 监控API使用量和费用

### 4. 环境变量配置（推荐）

为了安全起见，建议使用环境变量：

```javascript
// 在 aiConfig.js 中使用环境变量
const AI_MODELS_CONFIG = {
  'gpt4': {
    apiKey: process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY',
    // ...
  },
  // ...
};
```

### 5. 测试配置

配置完成后，可以通过以下方式测试：

1. 在小程序中点击"AI分析"
2. 选择已配置的模型
3. 查看控制台日志确认是否使用真实API
4. 检查分析结果的准确性

## 模型特点对比

| 模型 | 优势 | 适用场景 | 成本 |
|------|------|----------|------|
| GPT-4 | 综合能力强，医学知识丰富 | 通用医疗分析 | 较高 |
| Claude | 安全性高，逻辑推理强 | 健康风险评估 | 中等 |
| Gemini | 多模态分析，预测能力强 | 精准医疗建议 | 中等 |
| 文心一言 | 中文理解好，中西医结合 | 中医体质分析 | 较低 |

## 数据隐私保护

### 本地处理原则
- 病例数据仅在本地处理
- 不上传用户的敏感医疗信息
- 只发送脱敏的统计数据用于分析

### 发送的数据类型
- 家庭成员数量（数字）
- 病历记录数量（数字）
- 就诊科室类型（类别）
- 疾病类型（去除个人信息）

### 不发送的数据
- 姓名、身份证号等个人信息
- 具体的诊断报告内容
- 药物处方详情
- 医院和医生信息

## 故障处理

### 常见问题

1. **API密钥无效**
   - 检查密钥格式是否正确
   - 确认API密钥未过期
   - 验证账户余额

2. **请求频率限制**
   - 降低请求频率
   - 升级API套餐
   - 实现请求队列

3. **网络连接问题**
   - 检查网络连接
   - 配置代理设置
   - 使用备用API地址

### 调试模式

开启调试模式查看详细日志：

```javascript
// 在 aiConfig.js 中添加
const DEBUG_MODE = true;

if (DEBUG_MODE) {
  console.log('AI API 请求数据:', requestData);
  console.log('AI API 响应数据:', responseData);
}
```

## 联系支持

如有技术问题，请联系：
- 邮箱：support@ai-medical-app.com
- 微信群：扫码加入技术交流群
- GitHub Issues：提交问题和建议

---

**免责声明**：本AI分析功能仅供参考，不能替代专业医疗诊断。请用户在使用时谨慎判断，如有健康问题请及时就医。 