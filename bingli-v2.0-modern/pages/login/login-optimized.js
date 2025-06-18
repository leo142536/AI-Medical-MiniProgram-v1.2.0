const util = require('../../utils/util');

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    isLogging: false,
    loginStep: 1, // 1: 微信授权, 2: 完善信息, 3: 创建家庭
    showLoading: false,
    loadingText: '登录中...',
    
    // 表单数据
    formData: {
      name: '',
      gender: '',
      birthday: '',
      phone: '',
      emergencyContact: '',
      emergencyPhone: '',
      idCard: ''
    },
    
    // 选项数据
    genderOptions: [
      { label: '男', value: 'male' },
      { label: '女', value: 'female' }
    ],
    
    // 今日日期（用于生日选择限制）
    today: '',
    
    // 输入框焦点状态
    inputFocusState: {}
  },

  onLoad() {
    // 初始化数据
    this.initializeData();
    
    // 检查是否支持新的getUserProfile接口
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    // 检查是否已经登录
    this.checkLoginStatus();
    
    // 预加载背景音乐（如果需要）
    this.preloadAssets();
  },

  onShow() {
    // 页面显示时的动画
    this.playPageEnterAnimation();
  },

  // 初始化数据
  initializeData() {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    this.setData({
      today: todayStr
    });
  },

  // 预加载资源
  preloadAssets() {
    // 预加载下一个页面
    wx.preloadPage({
      url: '/pages/home/home'
    });
  },

  // 页面进入动画
  playPageEnterAnimation() {
    // 使用微信小程序的原生动画API
    setTimeout(() => {
      this.animate('.logo-section', [
        { opacity: 0, translateY: -50 },
        { opacity: 1, translateY: 0 }
      ], 800, () => {
        // Logo动画完成后，播放其他元素动画
        this.animate('.welcome-section', [
          { opacity: 0, translateY: 50 },
          { opacity: 1, translateY: 0 }
        ], 600);
      });
    }, 200);
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = util.getStorage('userInfo');
    const familyInfo = util.getStorage('familyInfo');
    
    if (userInfo && familyInfo) {
      // 已经完成所有步骤，显示完成动画后跳转
      this.showCompletionAnimation(() => {
        wx.switchTab({
          url: '/pages/home/home'
        });
      });
      return;
    }
    
    if (userInfo) {
      // 已经完成微信授权，进入下一步
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true,
        loginStep: familyInfo ? 3 : 2
      });
      
      // 预填充表单数据
      if (userInfo.nickName) {
        this.setData({
          'formData.name': userInfo.nickName
        });
      }
    }
  },

  // 微信登录授权
  getUserProfile() {
    if (this.data.isLogging) return;
    
    this.setData({ 
      isLogging: true,
      showLoading: true,
      loadingText: '正在获取用户信息...'
    });

    // 添加触觉反馈
    wx.vibrateShort({
      type: 'light'
    });
    
    wx.getUserProfile({
      desc: '用于完善用户资料，提供更好的健康管理服务',
      success: (res) => {
        console.log('获取用户信息成功:', res);
        
        // 保存用户信息
        const userInfo = {
          ...res.userInfo,
          loginTime: new Date().getTime(),
          deviceInfo: this.getDeviceInfo()
        };
        
        util.setStorage('userInfo', userInfo);
        
        // 成功动画
        this.showSuccessAnimation(() => {
          this.setData({
            userInfo: userInfo,
            hasUserInfo: true,
            loginStep: 2,
            isLogging: false,
            showLoading: false,
            'formData.name': userInfo.nickName || ''
          });
        });
        
        util.showToast('授权成功！正在进入下一步...', 'success');
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        this.handleLoginError('授权失败，请重试');
      }
    });
  },

  // 使用旧接口获取用户信息
  getUserInfo(e) {
    if (this.data.isLogging) return;
    
    if (e.detail.userInfo) {
      this.setData({ 
        isLogging: true,
        showLoading: true,
        loadingText: '正在处理用户信息...'
      });
      
      const userInfo = {
        ...e.detail.userInfo,
        loginTime: new Date().getTime(),
        deviceInfo: this.getDeviceInfo()
      };
      
      util.setStorage('userInfo', userInfo);
      
      this.showSuccessAnimation(() => {
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true,
          loginStep: 2,
          isLogging: false,
          showLoading: false,
          'formData.name': userInfo.nickName || ''
        });
      });
      
      util.showToast('授权成功！', 'success');
    } else {
      this.handleLoginError('授权失败，请重试');
    }
  },

  // 获取设备信息
  getDeviceInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      return {
        platform: systemInfo.platform,
        system: systemInfo.system,
        model: systemInfo.model,
        brand: systemInfo.brand,
        screenWidth: systemInfo.screenWidth,
        screenHeight: systemInfo.screenHeight
      };
    } catch (e) {
      return {};
    }
  },

  // 成功动画
  showSuccessAnimation(callback) {
    // 添加成功的视觉反馈
    setTimeout(() => {
      callback && callback();
    }, 1000);
  },

  // 完成动画
  showCompletionAnimation(callback) {
    setTimeout(() => {
      callback && callback();
    }, 2000);
  },

  // 处理登录错误
  handleLoginError(message) {
    this.setData({ 
      isLogging: false,
      showLoading: false
    });
    
    // 错误震动反馈
    wx.vibrateShort({
      type: 'heavy'
    });
    
    util.showToast(message, 'error');
  },

  // 表单输入处理
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`formData.${field}`]: value
    });
    
    // 实时验证
    this.validateField(field, value);
  },

  // 输入框焦点事件
  onInputFocus(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`inputFocusState.${field}`]: true
    });
  },

  // 输入框失焦事件
  onInputBlur(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`inputFocusState.${field}`]: false
    });
    
    // 失焦时验证
    this.validateField(field, value);
  },

  // 单字段验证
  validateField(field, value) {
    const { validate } = util;
    let isValid = true;
    
    switch (field) {
      case 'phone':
        if (value && !validate.phone(value)) {
          isValid = false;
        }
        break;
      case 'emergencyPhone':
        if (value && !validate.phone(value)) {
          isValid = false;
        }
        break;
      case 'idCard':
        if (value && !validate.idCard(value)) {
          isValid = false;
        }
        break;
    }
    
    // 可以在这里添加实时验证提示
    return isValid;
  },

  // 性别选择
  onGenderChange(e) {
    const index = e.detail.value;
    this.setData({
      'formData.gender': this.data.genderOptions[index].value
    });
    
    // 轻微触觉反馈
    wx.vibrateShort({
      type: 'light'
    });
  },

  // 日期选择
  onDateChange(e) {
    this.setData({
      'formData.birthday': e.detail.value
    });
    
    // 轻微触觉反馈
    wx.vibrateShort({
      type: 'light'
    });
  },

  // 验证表单
  validateForm() {
    const { formData } = this.data;
    const { validate } = util;
    
    const validations = [
      {
        condition: !validate.required(formData.name),
        message: '请输入姓名'
      },
      {
        condition: !validate.required(formData.gender),
        message: '请选择性别'
      },
      {
        condition: !validate.required(formData.birthday),
        message: '请选择生日'
      },
      {
        condition: formData.phone && !validate.phone(formData.phone),
        message: '手机号格式不正确'
      },
      {
        condition: formData.emergencyPhone && !validate.phone(formData.emergencyPhone),
        message: '紧急联系人电话格式不正确'
      },
      {
        condition: formData.idCard && !validate.idCard(formData.idCard),
        message: '身份证号格式不正确'
      }
    ];
    
    for (let validation of validations) {
      if (validation.condition) {
        util.showToast(validation.message, 'error');
        // 错误震动反馈
        wx.vibrateShort({
          type: 'heavy'
        });
        return false;
      }
    }
    
    return true;
  },

  // 完善信息提交
  submitUserInfo() {
    if (!this.validateForm()) return;
    
    this.setData({
      showLoading: true,
      loadingText: '正在保存个人信息...'
    });
    
    // 成功触觉反馈
    wx.vibrateShort({
      type: 'light'
    });
    
    // 模拟异步操作
    setTimeout(() => {
      const userInfo = {
        ...this.data.userInfo,
        ...this.data.formData,
        updateTime: new Date().getTime(),
        profileCompleted: true
      };
      
      util.setStorage('userInfo', userInfo);
      
      this.setData({
        userInfo: userInfo,
        loginStep: 3,
        showLoading: false
      });
      
      util.showToast('信息保存成功！', 'success');
      
      // 自动完成登录流程
      setTimeout(() => {
        this.completeLogin();
      }, 2000);
      
    }, 1500);
  },

  // 完成登录
  completeLogin() {
    this.setData({
      showLoading: true,
      loadingText: '正在进入应用...'
    });
    
    // 创建默认家庭信息
    const familyInfo = {
      id: util.generateId(),
      name: `${this.data.formData.name}的家庭`,
      creator: this.data.userInfo.nickName || this.data.formData.name,
      members: [
        {
          id: util.generateId(),
          name: this.data.formData.name,
          gender: this.data.formData.gender,
          birthday: this.data.formData.birthday,
          phone: this.data.formData.phone,
          avatar: this.data.userInfo.avatarUrl,
          role: 'admin',
          isDefault: true
        }
      ],
      createTime: new Date().getTime()
    };
    
    util.setStorage('familyInfo', familyInfo);
    
    // 成功完成动画
    setTimeout(() => {
      util.showToast('欢迎使用AI病例管理！', 'success');
      
      wx.switchTab({
        url: '/pages/home/home'
      });
    }, 1500);
  },

  // 跳过信息完善
  skipUserInfo() {
    wx.showModal({
      title: '跳过信息完善',
      content: '跳过后您可以在个人中心继续完善信息，确定要跳过吗？',
      confirmText: '跳过',
      cancelText: '继续填写',
      success: (res) => {
        if (res.confirm) {
          // 使用基础信息完成登录
          const userInfo = {
            ...this.data.userInfo,
            name: this.data.userInfo.nickName || '用户',
            profileCompleted: false,
            updateTime: new Date().getTime()
          };
          
          util.setStorage('userInfo', userInfo);
          this.setData({
            userInfo: userInfo,
            loginStep: 3
          });
          
          // 自动完成
          setTimeout(() => {
            this.completeLogin();
          }, 1000);
        }
      }
    });
  },

  // 返回上一步
  goBack() {
    if (this.data.loginStep > 1) {
      this.setData({
        loginStep: this.data.loginStep - 1
      });
      
      // 轻微触觉反馈
      wx.vibrateShort({
        type: 'light'
      });
    }
  },

  // 显示演示
  showDemo() {
    wx.showModal({
      title: '应用演示',
      content: '这里可以展示应用的主要功能和使用方法。是否观看演示视频？',
      confirmText: '观看',
      cancelText: '稍后',
      success: (res) => {
        if (res.confirm) {
          // 可以跳转到演示页面或播放演示视频
          util.showToast('演示功能开发中...', 'none');
        }
      }
    });
  },

  // 帮助页面
  goToHelp() {
    wx.showModal({
      title: '登录帮助',
      content: '遇到登录问题？\n\n1. 请确保网络连接正常\n2. 检查微信版本是否过旧\n3. 清除缓存后重试\n\n如问题持续，请联系客服。',
      confirmText: '联系客服',
      cancelText: '我知道了',
      success: (res) => {
        if (res.confirm) {
          // 联系客服功能
          wx.makePhoneCall({
            phoneNumber: '400-123-4567',
            fail: () => {
              util.showToast('客服电话：400-123-4567', 'none');
            }
          });
        }
      }
    });
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: 'AI病例管理 - 智能健康管理助手',
      desc: '让AI帮您守护家人健康',
      path: '/pages/login/login-optimized'
    };
  },

  // 页面卸载
  onUnload() {
    // 清理资源
    this.clearAnimations();
  },

  // 清理动画
  clearAnimations() {
    // 清理可能存在的动画
    this.clearAnimation('.logo-section');
    this.clearAnimation('.welcome-section');
  }
}); 