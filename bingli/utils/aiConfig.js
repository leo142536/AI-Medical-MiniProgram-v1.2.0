/**
 * AI模型配置文件
 * 开发者可以在这里配置不同AI模型的API信息
 */

// AI模型配置
const AI_MODELS_CONFIG = {
  'gpt4': {
    name: 'GPT-4 医疗助手',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: 'YOUR_OPENAI_API_KEY', // 需要开发者配置
    model: 'gpt-4',
    maxTokens: 2000,
    temperature: 0.3,
    systemPrompt: `你是一个专业的医疗助手，具备丰富的医学知识。请基于用户提供的病历信息进行专业分析，提供健康建议和风险评估。
注意：
1. 不要提供具体的诊断结论
2. 建议用户咨询专业医生
3. 重点关注预防和健康管理
4. 使用易懂的语言`
  },
  
  'claude': {
    name: 'Claude 健康分析师',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    apiKey: 'YOUR_ANTHROPIC_API_KEY', // 需要开发者配置
    model: 'claude-3-sonnet-20240229',
    maxTokens: 2000,
    temperature: 0.2,
    systemPrompt: `你是一位经验丰富的健康分析师，擅长从病历数据中发现健康趋势和风险因素。请为用户提供个性化的健康建议。
分析要点：
1. 病历趋势分析
2. 风险因素识别
3. 预防措施建议
4. 生活方式优化`
  },
  
  'gemini': {
    name: 'Gemini 医疗智能',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    apiKey: 'YOUR_GOOGLE_API_KEY', // 需要开发者配置
    model: 'gemini-pro',
    maxTokens: 2000,
    temperature: 0.4,
    systemPrompt: `你是一个多模态医疗AI助手，能够综合分析各种健康数据。请提供全面的健康洞察和精准的医疗建议。
分析维度：
1. 多模态数据融合分析
2. 预测性健康建模
3. 个体化医疗方案
4. 长期健康规划`
  },
  
  'baidu': {
    name: '百度文心医疗大模型',
    apiUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
    apiKey: 'YOUR_BAIDU_API_KEY', // 需要开发者配置
    secretKey: 'YOUR_BAIDU_SECRET_KEY', // 百度需要额外的密钥
    model: 'ERNIE-Bot-turbo',
    maxTokens: 2000,
    temperature: 0.3,
    systemPrompt: `你是一个中西医结合的智能医疗助手，具备传统中医和现代医学的双重知识体系。请结合中西医理论为用户提供健康分析。
分析角度：
1. 中医体质辨识
2. 西医指标分析
3. 中西医结合调理方案
4. 四季养生建议`
  }
};

// API调用函数（实际项目中使用）
const callAIAPI = async (modelId, analysisData) => {
  const config = AI_MODELS_CONFIG[modelId];
  if (!config) {
    throw new Error('未找到对应的AI模型配置');
  }
  
  try {
    // 构建请求数据
    const requestData = buildRequestData(config, analysisData);
    
    // 发送API请求
    const response = await wx.request({
      url: config.apiUrl,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      data: requestData
    });
    
    // 解析响应数据
    return parseResponse(modelId, response.data);
    
  } catch (error) {
    console.error(`AI API调用失败 (${modelId}):`, error);
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
    case 'gpt-4':
      return {
        model: config.model,
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature
      };
      
    case 'claude-3-sonnet-20240229':
      return {
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        system: config.systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      };
      
    case 'gemini-pro':
      return {
        contents: [{
          parts: [{
            text: `${config.systemPrompt}\n\n${userPrompt}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: config.maxTokens,
          temperature: config.temperature
        }
      };
      
    case 'ERNIE-Bot-turbo':
      return {
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_output_tokens: config.maxTokens,
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
      case 'gpt4':
        content = responseData.choices[0].message.content;
        break;
        
      case 'claude':
        content = responseData.content[0].text;
        break;
        
      case 'gemini':
        content = responseData.candidates[0].content.parts[0].text;
        break;
        
      case 'baidu':
        content = responseData.result;
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

// 检查API密钥配置
const checkAPIConfig = () => {
  const missingConfigs = [];
  
  Object.keys(AI_MODELS_CONFIG).forEach(modelId => {
    const config = AI_MODELS_CONFIG[modelId];
    if (config.apiKey === 'YOUR_OPENAI_API_KEY' || 
        config.apiKey === 'YOUR_ANTHROPIC_API_KEY' || 
        config.apiKey === 'YOUR_GOOGLE_API_KEY' || 
        config.apiKey === 'YOUR_BAIDU_API_KEY') {
      missingConfigs.push(modelId);
    }
  });
  
  return {
    isConfigured: missingConfigs.length === 0,
    missingConfigs: missingConfigs
  };
};

module.exports = {
  AI_MODELS_CONFIG,
  callAIAPI,
  checkAPIConfig
}; 