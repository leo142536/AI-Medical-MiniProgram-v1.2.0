// pages/settings/settings.js
const util = require('../../utils/util');
const InteractionFeedback = require('../../utils/interaction-feedback');

Page({
  data: {
    userInfo: null,
    showPrivacyModal: false,
    showAboutModal: false,
    showAdminModal: false,
    showApiConfigModal: false,
    adminPassword: '',
    isAdmin: false,
    
    // API配置数据
    apiConfigs: {
      doubao: {
        name: '豆包',
        apiKey: '',
        endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        model: 'ep-20241218-******',
        enabled: false
      },
      deepseek: {
        name: 'DeepSeek',
        apiKey: '',
        endpoint: 'https://api.deepseek.com/chat/completions',
        model: 'deepseek-chat',
        enabled: false
      },
      stepfun: {
        name: '阶跃星辰',
        apiKey: '',
        endpoint: 'https://api.stepfun.com/v1/chat/completions',
        model: 'step-1v-8k',
        enabled: false
      }
    },
    
    currentEditingApi: null,
    editingApiKey: '',
    editingEndpoint: '',
    editingModel: '',
    
    settingsMenu: [
      {
        id: 'privacy',
        title: '隐私设置',
        icon: '🔒',
        description: '管理数据隐私和权限'
      },
      {
        id: 'notification',
        title: '通知设置',
        icon: '🔔',
        description: '设置提醒和通知'
      },
      {
        id: 'data',
        title: '数据管理',
        icon: '💾',
        description: '备份和导出数据'
      },
      {
        id: 'admin',
        title: '管理员设置',
        icon: '⚙️',
        description: '系统配置和API管理',
        adminOnly: true
      },
      {
        id: 'about',
        title: '关于应用',
        icon: 'ℹ️',
        description: '版本信息和帮助'
      }
    ]
  },

  onLoad() {
    InteractionFeedback.showLoading('正在加载设置页面...');
    this.loadUserInfo();
    this.loadApiConfigs();
    this.checkAdminStatus();
    InteractionFeedback.hideLoading();
  },

  loadUserInfo() {
    const userInfo = util.getStorage('userInfo');
    this.setData({ userInfo });
  },

  loadApiConfigs() {
    // 首先从aiConfig.js获取全局配置
    const aiConfig = require('../../utils/aiConfig');
    const globalConfigs = aiConfig.AI_MODELS_CONFIG;
    
    // 检查API配置状态
    const configCheck = aiConfig.checkAPIConfig();
    
    // 合并全局配置和本地存储的配置
    const savedConfigs = util.getStorage('apiConfigs') || {};
    const updatedConfigs = {};
    
    // 更新豆包配置
    updatedConfigs.doubao = {
      name: '豆包',
      apiKey: globalConfigs.doubao?.apiKey || savedConfigs.doubao?.apiKey || '',
      endpoint: globalConfigs.doubao?.apiUrl || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      model: globalConfigs.doubao?.model || 'ep-20241218-******',
      enabled: globalConfigs.doubao?.apiKey && !globalConfigs.doubao.apiKey.startsWith('YOUR_')
    };
    
    // 更新DeepSeek配置
    updatedConfigs.deepseek = {
      name: 'DeepSeek',
      apiKey: globalConfigs.deepseek?.apiKey || savedConfigs.deepseek?.apiKey || '',
      endpoint: globalConfigs.deepseek?.apiUrl || 'https://api.deepseek.com/chat/completions',
      model: globalConfigs.deepseek?.model || 'deepseek-chat',
      enabled: globalConfigs.deepseek?.apiKey && !globalConfigs.deepseek.apiKey.startsWith('YOUR_')
    };
    
    // 更新阶跃星辰配置
    updatedConfigs.stepfun = {
      name: '阶跃星辰',
      apiKey: globalConfigs.stepfun?.apiKey || savedConfigs.stepfun?.apiKey || '',
      endpoint: globalConfigs.stepfun?.apiUrl || 'https://api.stepfun.com/v1/chat/completions',
      model: globalConfigs.stepfun?.model || 'step-1v-8k',
      enabled: globalConfigs.stepfun?.apiKey && !globalConfigs.stepfun.apiKey.startsWith('YOUR_')
    };
    
    console.log('📊 API配置状态:', configCheck);
    console.log('🔧 已配置的API:', updatedConfigs);
    
    this.setData({ apiConfigs: updatedConfigs });
  },

  checkAdminStatus() {
    const isAdmin = util.getStorage('isAdmin') || false;
    this.setData({ isAdmin });
  },

  onSettingTap(e) {
    const { id } = e.currentTarget.dataset;
    
    switch (id) {
      case 'privacy':
        this.setData({ showPrivacyModal: true });
        break;
      case 'about':
        this.setData({ showAboutModal: true });
        break;
      case 'admin':
        if (this.data.isAdmin) {
          this.setData({ showApiConfigModal: true });
        } else {
          this.setData({ showAdminModal: true });
        }
        break;
      case 'notification':
        InteractionFeedback.showInfo('功能开发中，敬请期待');
        break;
      case 'data':
        this.showDataManagementOptions();
        break;
    }
  },

  // 管理员验证
  onAdminPasswordInput(e) {
    this.setData({ adminPassword: e.detail.value });
  },

  onAdminLogin() {
    const { adminPassword } = this.data;
    // 这里可以设置管理员密码，建议使用加密存储
    const correctPassword = 'admin123'; // 生产环境应该使用更安全的方式
    
    if (adminPassword === correctPassword) {
      this.setData({
        isAdmin: true,
        showAdminModal: false,
        showApiConfigModal: true,
        adminPassword: ''
      });
      util.setStorage('isAdmin', true);
      InteractionFeedback.showSuccess('管理员登录成功');
    } else {
      InteractionFeedback.showError('密码错误');
      this.setData({ adminPassword: '' });
    }
  },

  // API配置管理
  onEditApi(e) {
    const { api } = e.currentTarget.dataset;
    const config = this.data.apiConfigs[api];
    
    this.setData({
      currentEditingApi: api,
      editingApiKey: config.apiKey,
      editingEndpoint: config.endpoint,
      editingModel: config.model
    });
  },

  onApiKeyInput(e) {
    this.setData({ editingApiKey: e.detail.value });
  },

  onEndpointInput(e) {
    this.setData({ editingEndpoint: e.detail.value });
  },

  onModelInput(e) {
    this.setData({ editingModel: e.detail.value });
  },

  onSaveApiConfig() {
    const { currentEditingApi, editingApiKey, editingEndpoint, editingModel } = this.data;
    
    if (!editingApiKey.trim()) {
      InteractionFeedback.showError('API Key不能为空');
      return;
    }

    const updatedConfigs = { ...this.data.apiConfigs };
    updatedConfigs[currentEditingApi] = {
      ...updatedConfigs[currentEditingApi],
      apiKey: editingApiKey,
      endpoint: editingEndpoint,
      model: editingModel,
      enabled: true
    };

    this.setData({
      apiConfigs: updatedConfigs,
      currentEditingApi: null,
      editingApiKey: '',
      editingEndpoint: '',
      editingModel: ''
    });

    // 保存到本地存储
    util.setStorage('apiConfigs', updatedConfigs);
    
    // 更新全局AI配置
    this.updateGlobalAIConfig(updatedConfigs);

    InteractionFeedback.showSuccess('配置保存成功');
  },

  onCancelApiEdit() {
    this.setData({
      currentEditingApi: null,
      editingApiKey: '',
      editingEndpoint: '',
      editingModel: ''
    });
  },

  onToggleApiEnabled(e) {
    const { api } = e.currentTarget.dataset;
    const updatedConfigs = { ...this.data.apiConfigs };
    updatedConfigs[api].enabled = !updatedConfigs[api].enabled;
    
    this.setData({ apiConfigs: updatedConfigs });
    util.setStorage('apiConfigs', updatedConfigs);
    
    this.updateGlobalAIConfig(updatedConfigs);
  },

  updateGlobalAIConfig(configs) {
    // 更新全局AI配置文件
    const globalConfigs = {};
    
    Object.keys(configs).forEach(key => {
      if (configs[key].enabled && configs[key].apiKey) {
        globalConfigs[key] = {
          name: configs[key].name,
          apiUrl: configs[key].endpoint,
          apiKey: configs[key].apiKey,
          model: configs[key].model,
          maxTokens: 2000,
          temperature: 0.3
        };
      }
    });

    // 这里可以将配置写入到aiConfig.js文件或者存储到云端
    console.log('更新全局AI配置:', globalConfigs);
  },

  onTestApiConnection(e) {
    const { api } = e.currentTarget.dataset;
    const config = this.data.apiConfigs[api];
    
    if (!config.apiKey) {
      InteractionFeedback.showError('请先配置API Key');
      return;
    }

    InteractionFeedback.showLoading('测试连接中...');

    // 模拟API测试
    setTimeout(() => {
      InteractionFeedback.hideLoading();
      InteractionFeedback.showSuccess('连接测试成功');
    }, 2000);
  },

  showDataManagementOptions() {
    wx.showActionSheet({
      itemList: ['导出数据', '备份数据', '清除数据'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.exportData();
            break;
          case 1:
            this.backupData();
            break;
          case 2:
            this.clearData();
            break;
        }
      }
    });
  },

  exportData() {
    InteractionFeedback.showInfo('数据导出功能开发中');
  },

  backupData() {
    InteractionFeedback.showInfo('数据备份功能开发中');
  },

  clearData() {
    wx.showModal({
      title: '确认清除',
      content: '此操作将清除所有本地数据，是否继续？',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          InteractionFeedback.showSuccess('数据已清除');
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/login/login'
            });
          }, 1500);
        }
      }
    });
  },

  // 关闭弹窗
  onClosePrivacyModal() {
    this.setData({ showPrivacyModal: false });
  },

  onCloseAboutModal() {
    this.setData({ showAboutModal: false });
  },

  onCloseAdminModal() {
    this.setData({ 
      showAdminModal: false,
      adminPassword: ''
    });
  },

  onCloseApiConfigModal() {
    this.setData({ 
      showApiConfigModal: false,
      currentEditingApi: null
    });
  },

  onLogoutAdmin() {
    this.setData({ isAdmin: false });
    util.removeStorage('isAdmin');
    InteractionFeedback.showSuccess('已退出管理员模式');
  }
}); 