// pages/home/home.js
const util = require('../../utils/util');

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    familyMembers: [],
    recentRecords: [],
    upcomingReminders: [],
    timeGreeting: '',
    weather: '',
    isNavigating: false,
    isDeleteMode: false,
    showFamilyModal: false,
    allFamilyMembers: [],
    showAIModal: false,
    selectedModel: null,
    analysisResult: null,
    isAnalyzing: false,
    aiModels: [
      {
        id: 'gpt4',
        name: 'GPT-4 医疗助手',
        description: '基于OpenAI GPT-4的专业医疗分析模型',
        icon: '🤖',
        features: ['深度学习', '多语言支持', '专业医疗知识'],
        accuracy: '95%'
      },
      {
        id: 'claude',
        name: 'Claude 健康分析师',
        description: 'Anthropic Claude专业健康分析模型',
        icon: '🩺',
        features: ['安全可靠', '逻辑推理', '个性化建议'],
        accuracy: '92%'
      },
      {
        id: 'gemini',
        name: 'Gemini 医疗智能',
        description: 'Google Gemini多模态医疗分析',
        icon: '💎',
        features: ['多模态分析', '预测建模', '精准医疗'],
        accuracy: '88%'
      },
      {
        id: 'baidu',
        name: '百度文心医疗大模型',
        description: '百度文心一言中医西医结合分析',
        icon: '🌿',
        features: ['中西医结合', '本土化', '体质分析'],
        accuracy: '90%'
      }
    ],
    quickActions: [
      {
        id: 'add-record',
        title: '添加病历',
        icon: '📋',
        path: '/pages/record/edit/edit'
      },
      {
        id: 'add-reminder',
        title: '设置提醒',
        icon: '⏰',
        path: '/pages/reminder/add/add'
      },
      {
        id: 'ai-analysis',
        title: 'AI分析',
        icon: '🤖',
        action: 'aiAnalysis'
      }
    ]
  },

  onLoad() {
    console.log('首页加载');
    this.checkUserInfo();
    this.setTimeGreeting();
    this.loadData();
  },

  onShow() {
    console.log('首页显示');
    // 重置导航状态
    this.setData({ isNavigating: false });
    this.loadData();
  },

  // 检查用户信息
  checkUserInfo() {
    const userInfo = util.getStorage('userInfo');
    const familyInfo = util.getStorage('familyInfo');
    
    if (!userInfo || !familyInfo) {
      // 未登录，跳转到登录页面
      wx.redirectTo({
        url: '/pages/login/login'
      });
      return;
    }
    
    this.setData({
      userInfo: userInfo,
      hasUserInfo: true
    });
  },

  // 设置时间问候语
  setTimeGreeting() {
    const timeGreeting = util.getTimeGreeting();
    this.setData({
      timeGreeting: timeGreeting,
      weather: '晴天 22°C' // 模拟天气数据
    });
  },

  // 加载首页数据
  loadData() {
    this.loadFamilyMembers();
    this.loadRecentRecords();
    this.loadUpcomingReminders();
  },

  // 加载家庭成员
  loadFamilyMembers() {
    const familyInfo = util.getStorage('familyInfo');
    const userInfo = util.getStorage('userInfo');
    
    let members = [];
    
    // 首先添加用户本人
    if (userInfo) {
      members.push({
        id: 'self',
        name: userInfo.nickName || '本人',
        relation: '本人',
        avatar: userInfo.avatarUrl || '/images/default-avatar.png'
      });
    }
    
    // 然后添加家庭成员
    if (familyInfo && familyInfo.members) {
      members = members.concat(familyInfo.members);
    }
    
    // 只显示前4个成员
    const displayMembers = members.slice(0, 4);
    this.setData({
      familyMembers: displayMembers
    });
  },

  // 加载最近病历
  loadRecentRecords() {
    // TODO: 从云数据库加载最近病历数据
    const mockData = [
      {
        id: 1,
        title: '感冒就诊',
        date: '2024-12-18',
        member: '张三',
        relation: '二舅',
        hospital: '中山医院'
      },
      {
        id: 2,
        title: '体检报告',
        date: '2024-12-15',
        member: '李四',
        relation: '母亲',
        hospital: '健康体检中心'
      }
    ];
    this.setData({
      recentRecords: mockData
    });
  },

  // 加载即将到来的提醒
  loadUpcomingReminders() {
    // TODO: 从云数据库加载提醒数据
    const mockData = [
      {
        id: 1,
        title: '复诊提醒',
        time: '明天 14:00',
        member: '张三',
        relation: '二舅',
        type: 'medical'
      },
      {
        id: 2,
        title: '服药提醒',
        time: '今天 18:00',
        member: '李四',
        relation: '母亲',
        type: 'medicine'
      }
    ];
    this.setData({
      upcomingReminders: mockData
    });
  },

  // 快捷操作点击
  onQuickActionTap(e) {
    const dataset = e.currentTarget.dataset;
    const actionId = dataset.id;
    const path = dataset.path;
    
    // 特殊处理AI分析
    if (actionId === 'ai-analysis') {
      this.onAIAnalysis();
      return;
    }
    
    if (path) {
      wx.navigateTo({
        url: path,
        fail: () => {
          wx.switchTab({
            url: path
          });
        }
      });
    }
  },

  // AI分析功能
  onAIAnalysis() {
    this.setData({
      showAIModal: true
    });
  },

  // 关闭AI分析弹窗
  onCloseAIModal() {
    this.setData({
      showAIModal: false,
      selectedModel: null,
      analysisResult: null,
      isAnalyzing: false
    });
  },

  // 选择AI模型
  onSelectModel(e) {
    const { model } = e.currentTarget.dataset;
    this.setData({
      selectedModel: model
    });
  },

  // 开始AI分析
  onStartAnalysis() {
    if (!this.data.selectedModel) {
      util.showToast('请先选择AI模型');
      return;
    }

    this.setData({
      isAnalyzing: true,
      analysisResult: null
    });

    // 模拟AI分析过程
    this.performAIAnalysis();
  },

  // 执行AI分析
  async performAIAnalysis() {
    const { selectedModel } = this.data;
    
    // 获取本地病历数据进行分析（不上传到服务器）
    const familyInfo = util.getStorage('familyInfo') || { members: [] };
    
    // 检查是否配置了真实的API密钥
    const aiConfig = require('../../utils/aiConfig');
    const configCheck = aiConfig.checkAPIConfig();
    
    try {
      let analysisResult;
      
      if (configCheck.isConfigured && !configCheck.missingConfigs.includes(selectedModel)) {
        // 使用真实API
        console.log('使用真实AI API进行分析...');
        const analysisData = {
          familyMemberCount: familyInfo.members.length + 1,
          recordCount: this.data.recentRecords.length,
          recentRecords: this.data.recentRecords
        };
        
        const apiResult = await aiConfig.callAIAPI(selectedModel, analysisData);
        
        if (apiResult.success) {
          analysisResult = {
            name: aiConfig.AI_MODELS_CONFIG[selectedModel].name,
            analysis: apiResult.content,
            confidence: '真实AI分析'
          };
        } else {
          throw new Error(apiResult.error);
        }
        
      } else {
        // 使用模拟数据
        console.log('使用模拟数据进行演示...');
        analysisResult = this.generateMockAnalysis(selectedModel, familyInfo);
        
        // 模拟网络请求延迟
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
      }
      
      this.setData({
        isAnalyzing: false,
        analysisResult: analysisResult
      });
      
    } catch (error) {
      console.error('AI分析失败:', error);
      
      // 发生错误时使用模拟数据作为备选
      const mockAnalysisData = this.generateMockAnalysis(selectedModel, familyInfo);
      mockAnalysisData.analysis = `⚠️ API调用失败，以下为演示数据：\n\n${mockAnalysisData.analysis}`;
      
      this.setData({
        isAnalyzing: false,
        analysisResult: mockAnalysisData
      });
      
      wx.showToast({
        title: 'API未配置，使用演示',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 生成模拟分析结果
  generateMockAnalysis(model, familyData) {
    const memberCount = familyData.members.length + 1; // +1 for self
    const recordCount = this.data.recentRecords.length;
    
    const analysisTemplates = {
      'gpt4': {
        name: 'GPT-4 医疗助手',
        analysis: `基于GPT-4深度学习分析：

📊 家庭健康概况
• 家庭成员：${memberCount}人
• 病历记录：${recordCount}条
• 整体健康状态：良好

🔍 智能诊断建议
• 建议定期进行全面体检
• 关注慢性疾病预防
• 保持良好生活习惯

⚠️ 风险评估
• 总体风险等级：低风险
• 需要关注的指标：血压、血糖
• 建议复查时间：6个月后`,
        confidence: '95%'
      },
      'claude': {
        name: 'Claude 健康分析师',
        analysis: `Claude AI 专业医疗分析报告：

🏥 病历趋势分析
• 就诊频率：正常范围
• 主要疾病类型：常见疾病
• 治疗效果：良好

💡 个性化建议
• 根据年龄结构，建议加强老年人健康监护
• 建立家庭健康档案管理制度
• 定期进行健康数据监测

📈 预测性分析
• 未来6个月健康趋势：稳定
• 潜在风险因素：季节性疾病
• 预防措施：疫苗接种、营养补充`,
        confidence: '92%'
      },
      'gemini': {
        name: 'Gemini 医疗智能',
        analysis: `Gemini多模态医疗分析：

🧬 深度健康洞察
• 家族健康模式识别完成
• 疾病关联性分析：无显著风险
• 生活方式评估：健康水平中等

🎯 精准医疗建议
• 个体化体检方案：心血管+内分泌检查
• 营养膳食优化：增加蛋白质摄入
• 运动处方：有氧运动30分钟/天

🔮 健康预测模型
• 3个月内疾病风险：5%
• 建议预防重点：呼吸道感染
• 最佳就医时机：症状出现24小时内`,
        confidence: '88%'
      },
      'baidu': {
        name: '百度文心医疗大模型',
        analysis: `文心一言中医西医结合分析：

🌿 中西医结合诊断
• 体质类型：平和质偏湿热
• 脏腑功能：脾胃功能良好
• 气血状态：气血运行正常

📋 综合健康评估
• 西医指标：各项生理指标正常
• 中医体质：建议调理湿热体质
• 生活建议：清淡饮食，适量运动

🍃 调理方案
• 饮食调理：多食用薏米、冬瓜等祛湿食物
• 起居调理：早睡早起，避免熬夜
• 情志调理：保持心情舒畅`,
        confidence: '90%'
      }
    };

    return analysisTemplates[model] || analysisTemplates['gpt4'];
  },

  // 保存AI分析报告
  onSaveReport() {
    if (!this.data.analysisResult) return;
    
    const report = {
      id: Date.now(),
      modelName: this.data.analysisResult.name,
      confidence: this.data.analysisResult.confidence,
      analysis: this.data.analysisResult.analysis,
      createTime: new Date().toLocaleString(),
      familyMemberCount: this.data.familyMembers.length + 1,
      recordCount: this.data.recentRecords.length
    };
    
    // 保存到本地存储
    let reports = util.getStorage('aiReports') || [];
    reports.unshift(report); // 最新的放在前面
    
    // 只保留最近10份报告
    if (reports.length > 10) {
      reports = reports.slice(0, 10);
    }
    
    util.setStorage('aiReports', reports);
    
    wx.showToast({
      title: '报告已保存',
      icon: 'success'
    });
    
    // 关闭弹窗
    this.onCloseAIModal();
  },

  // 查看更多家庭成员
  onViewMoreFamily() {
    // 加载所有家庭成员
    this.loadAllFamilyMembers();
    this.setData({
      showFamilyModal: true
    });
  },

  // 加载所有家庭成员
  loadAllFamilyMembers() {
    const familyInfo = util.getStorage('familyInfo');
    const userInfo = util.getStorage('userInfo');
    
    let allMembers = [];
    
    // 首先添加用户本人
    if (userInfo) {
      allMembers.push({
        id: 'self',
        name: userInfo.nickName || '本人',
        relation: '本人',
        avatar: userInfo.avatarUrl || '/images/default-avatar.png'
      });
    }
    
    // 然后添加家庭成员
    if (familyInfo && familyInfo.members) {
      allMembers = allMembers.concat(familyInfo.members);
    }
    
    this.setData({
      allFamilyMembers: allMembers
    });
  },

  // 关闭家庭成员弹窗
  onCloseFamilyModal() {
    this.setData({
      showFamilyModal: false
    });
  },

  // 添加家庭成员
  onAddFamilyMember(e) {
    // 阻止事件冒泡，避免触发成员点击事件
    if (e) e.stopPropagation();
    
    // 防止重复点击
    if (this.data.isNavigating) {
      return;
    }
    
    this.setData({ isNavigating: true });
    
    wx.navigateTo({
      url: '/pages/family/add/add',
      success: () => {
        // 导航成功后重置状态
        setTimeout(() => {
          this.setData({ isNavigating: false });
        }, 1000);
      },
      fail: () => {
        // 导航失败时重置状态
        this.setData({ isNavigating: false });
      }
    });
  },

  // 查看更多病历
  onViewMoreRecords() {
    wx.switchTab({
      url: '/pages/record/record'
    });
  },

  // 查看更多提醒
  onViewMoreReminders() {
    wx.switchTab({
      url: '/pages/reminder/reminder'
    });
  },

  // 切换删除模式
  onToggleDeleteMode() {
    this.setData({
      isDeleteMode: !this.data.isDeleteMode
    });
  },

  // 删除成员
  onDeleteMember(e) {
    e.stopPropagation(); // 阻止事件冒泡
    
    const { id, name } = e.currentTarget.dataset;
    
    util.showConfirm(`确定要删除成员"${name}"吗？`, '删除确认').then(confirmed => {
      if (confirmed) {
        this.deleteFamilyMember(id);
      }
    });
  },

  // 执行删除成员
  deleteFamilyMember(memberId) {
    try {
      util.showLoading('删除中...');
      
      const familyInfo = util.getStorage('familyInfo') || { members: [] };
      
      // 过滤掉要删除的成员
      familyInfo.members = familyInfo.members.filter(member => member.id !== memberId);
      
      // 保存更新后的数据
      const saveResult = util.setStorage('familyInfo', familyInfo);
      
      if (saveResult) {
        util.hideLoading();
        util.showToast('删除成功', 'success');
        
        // 重新加载数据
        this.loadFamilyMembers();
      } else {
        throw new Error('删除失败');
      }
      
    } catch (error) {
      util.hideLoading();
      console.error('删除成员失败:', error);
      util.showToast('删除失败，请重试');
    }
  },

  // 家庭成员点击
  onFamilyMemberTap(e) {
    // 删除模式下不响应点击
    if (this.data.isDeleteMode) {
      return;
    }
    
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/family/detail/detail?id=${id}`
    });
  },

  // 病历项点击
  onRecordTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/record/detail/detail?id=${id}`
    });
  },

  // 提醒项点击
  onReminderTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/reminder/detail/detail?id=${id}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  },

  // 开始使用
  onStartUse() {
    wx.redirectTo({
      url: '/pages/login/login'
    });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: 'AI病例管理 - 智能健康管理助手',
      path: '/pages/home/home'
    };
  }
}); 