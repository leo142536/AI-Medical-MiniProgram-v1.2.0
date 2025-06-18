/**
 * AI模型配置文件
 * 开发者可以在这里配置不同AI模型的API信息
 */

// AI模型配置
const AI_MODELS_CONFIG = {
  'doubao': {
    name: '豆包',
    apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    apiKey: 'YOUR_DOUBAO_API_KEY', // 需要开发者配置
    model: 'ep-20241218-******',
    maxTokens: 2000,
    temperature: 0.3,
    systemPrompt: `你是一个专业的医疗助手，具备丰富的医学知识。请基于用户提供的病历信息进行专业分析，提供健康建议和风险评估。
注意：
1. 不要提供具体的诊断结论
2. 建议用户咨询专业医生
3. 重点关注预防和健康管理
4. 使用易懂的语言`
  },
  
  'deepseek': {
    name: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/chat/completions',
    apiKey: 'sk-3dc5157f94f446278442e40b9f230406', // 用户提供的真实API密钥
    model: 'deepseek-chat',
    maxTokens: 2000,
    temperature: 0.2,
    systemPrompt: `你是一位经验丰富的健康分析师，擅长从病历数据中发现健康趋势和风险因素。请为用户提供个性化的健康建议。
分析要点：
1. 病历趋势分析
2. 风险因素识别
3. 预防措施建议
4. 生活方式优化`
  },
  
  'stepfun': {
    name: '阶跃星辰',
    apiUrl: 'https://api.stepfun.com/v1/chat/completions',
    apiKey: 'YOUR_STEPFUN_API_KEY', // 需要开发者配置
    model: 'step-1v-8k',
    maxTokens: 2000,
    temperature: 0.4,
    systemPrompt: `你是一个智能医疗AI助手，能够综合分析各种健康数据。请提供全面的健康洞察和精准的医疗建议。
分析维度：
1. 健康数据综合分析
2. 预测性健康建模
3. 个体化医疗方案
4. 长期健康规划`
  }
};

// 检查API配置状态
const checkAPIConfig = () => {
  const isConfigured = Object.keys(AI_MODELS_CONFIG).some(key => {
    const config = AI_MODELS_CONFIG[key];
    return config.apiKey && config.apiKey !== `YOUR_${key.toUpperCase()}_API_KEY`;
  });
  
  const missingConfigs = Object.keys(AI_MODELS_CONFIG).filter(key => {
    const config = AI_MODELS_CONFIG[key];
    return !config.apiKey || config.apiKey.startsWith('YOUR_');
  });
  
  return {
    isConfigured,
    missingConfigs,
    availableModels: Object.keys(AI_MODELS_CONFIG).filter(key => !missingConfigs.includes(key))
  };
};

// 微信小程序环境下的API调用函数
const callAIAPI = async (modelId, analysisData) => {
  const config = AI_MODELS_CONFIG[modelId];
  if (!config) {
    throw new Error('未找到对应的AI模型配置');
  }
  
  // 检查API密钥是否配置
  if (!config.apiKey || config.apiKey.startsWith('YOUR_')) {
    throw new Error('API密钥未配置，将使用模拟数据');
  }
  
  try {
    // 构建请求数据
    const requestData = buildRequestData(config, analysisData);
    
    console.log('🔍 调用真实AI API:', modelId);
    console.log('📤 请求数据:', requestData);
    
    // 发送微信小程序网络请求
    return new Promise((resolve, reject) => {
      wx.request({
        url: config.apiUrl,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        data: requestData,
        success: (res) => {
          console.log('📡 响应状态码:', res.statusCode);
          console.log('📥 响应数据:', res.data);
          
          if (res.statusCode === 200) {
            const result = parseResponse(modelId, res.data);
            resolve(result);
          } else {
            console.error('❌ API调用失败:', res.data);
            reject(new Error(`API Error: ${res.statusCode} - ${JSON.stringify(res.data)}`));
          }
        },
        fail: (error) => {
          console.error('❌ 网络请求失败:', error);
          reject(new Error(`Network Error: ${error.errMsg}`));
        }
      });
    });
    
  } catch (error) {
    console.error(`❌ AI API调用失败 (${modelId}):`, error);
    throw error;
  }
};

// 构建请求数据
const buildRequestData = (config, analysisData) => {
  const { familyMemberCount, recordCount, recentRecords } = analysisData;
  
  const userPrompt = `请分析以下家庭健康数据：
- 家庭成员数量：${familyMemberCount}人
- 病历记录数量：${recordCount}条
- 近期就诊情况：${recentRecords.map(r => `${r.memberName}在${r.hospital}就诊，诊断：${r.diagnosis}`).join('；')}

请提供专业的健康分析和建议。`;

  // 根据不同模型构建不同格式的请求数据
  switch (config.model) {
    case 'ep-20241218-******':
    case 'deepseek-chat':
    case 'step-1v-8k':
      return {
        model: config.model,
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature
      };
      
    default:
      throw new Error('不支持的AI模型');
  }
};

// 解析API响应
const parseResponse = (modelId, responseData) => {
  try {
    let content = '';
    
    switch (modelId) {
      case 'doubao':
      case 'deepseek':
      case 'stepfun':
        content = responseData.choices[0].message.content;
        break;
        
      default:
        throw new Error('未知的模型响应格式');
    }
    
    return {
      success: true,
      content: content,
      modelId: modelId
    };
    
  } catch (error) {
    console.error('解析AI响应失败:', error);
    return {
      success: false,
      error: error.message,
      modelId: modelId
    };
  }
};

// 导出配置和函数
module.exports = {
  AI_MODELS_CONFIG,
  callAIAPI,
  buildRequestData,
  parseResponse,
  checkAPIConfig
}; 