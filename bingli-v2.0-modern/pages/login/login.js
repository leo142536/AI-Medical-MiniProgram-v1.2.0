const util = require('../../utils/util');

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    isLogging: false,
    loginStep: 1, // 1: 微信授权, 2: 完善信息, 3: 创建家庭
    formData: {
      name: '',
      gender: '',
      birthday: '',
      phone: '',
      emergencyContact: '',
      emergencyPhone: '',
      idCard: ''
    },
    genderOptions: [
      { label: '男', value: 'male' },
      { label: '女', value: 'female' }
    ]
  },

  onLoad() {
    // 检查是否支持新的getUserProfile接口
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    // 检查是否已经登录
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = util.getStorage('userInfo');
    const familyInfo = util.getStorage('familyInfo');
    
    if (userInfo && familyInfo) {
      // 已经完成所有步骤，跳转到首页
      wx.switchTab({
        url: '/pages/home/home'
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
    }
  },

  // 微信登录授权
  getUserProfile() {
    if (this.data.isLogging) return;
    
    this.setData({ isLogging: true });
    
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        console.log('获取用户信息成功:', res);
        
        // 保存用户信息
        const userInfo = {
          ...res.userInfo,
          loginTime: new Date().getTime()
        };
        
        util.setStorage('userInfo', userInfo);
        
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true,
          loginStep: 2,
          isLogging: false
        });
        
        util.showToast('授权成功', 'success');
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        util.showToast('授权失败，请重试');
        this.setData({ isLogging: false });
      }
    });
  },

  // 使用旧接口获取用户信息
  getUserInfo(e) {
    if (this.data.isLogging) return;
    
    if (e.detail.userInfo) {
      this.setData({ isLogging: true });
      
      const userInfo = {
        ...e.detail.userInfo,
        loginTime: new Date().getTime()
      };
      
      util.setStorage('userInfo', userInfo);
      
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true,
        loginStep: 2,
        isLogging: false
      });
      
      util.showToast('授权成功', 'success');
    } else {
      util.showToast('授权失败，请重试');
    }
  },

  // 表单输入处理
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 性别选择
  onGenderChange(e) {
    const index = e.detail.value;
    this.setData({
      'formData.gender': this.data.genderOptions[index].value
    });
  },

  // 日期选择
  onDateChange(e) {
    this.setData({
      'formData.birthday': e.detail.value
    });
  },

  // 验证表单
  validateForm() {
    const { formData } = this.data;
    const { validate } = util;
    
    if (!validate.required(formData.name)) {
      util.showToast('请输入姓名');
      return false;
    }
    
    if (!validate.required(formData.gender)) {
      util.showToast('请选择性别');
      return false;
    }
    
    if (!validate.required(formData.birthday)) {
      util.showToast('请选择生日');
      return false;
    }
    
    if (formData.phone && !validate.phone(formData.phone)) {
      util.showToast('手机号格式不正确');
      return false;
    }
    
    if (formData.emergencyPhone && !validate.phone(formData.emergencyPhone)) {
      util.showToast('紧急联系人电话格式不正确');
      return false;
    }
    
    if (formData.idCard && !validate.idCard(formData.idCard)) {
      util.showToast('身份证号格式不正确');
      return false;
    }
    
    return true;
  },

  // 完善信息提交
  submitUserInfo() {
    if (!this.validateForm()) return;
    
    util.showLoading('保存中...');
    
    // 模拟异步操作
    setTimeout(() => {
      const userInfo = {
        ...this.data.userInfo,
        ...this.data.formData,
        updateTime: new Date().getTime()
      };
      
      util.setStorage('userInfo', userInfo);
      
      this.setData({
        userInfo: userInfo,
        loginStep: 3
      });
      
      util.hideLoading();
      util.showToast('信息保存成功', 'success');
    }, 1000);
  },

  // 创建家庭
  createFamily() {
    util.showLoading('创建中...');
    
    // 模拟异步操作
    setTimeout(() => {
      const familyInfo = {
        id: util.generateId(),
        name: `${this.data.userInfo.name}的家庭`,
        createTime: new Date().getTime(),
        members: [
          {
            id: util.generateId(),
            name: this.data.userInfo.name,
            relation: '本人',
            gender: this.data.formData.gender,
            birthday: this.data.formData.birthday,
            phone: this.data.formData.phone,
            emergencyContact: this.data.formData.emergencyContact,
            emergencyPhone: this.data.formData.emergencyPhone,
            idCard: this.data.formData.idCard,
            avatar: this.data.userInfo.avatarUrl,
            role: 'admin', // 创建者默认为管理员
            createTime: new Date().getTime()
          }
        ]
      };
      
      util.setStorage('familyInfo', familyInfo);
      
      util.hideLoading();
      util.showToast('家庭创建成功', 'success');
      
      // 跳转到首页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/home/home'
        });
      }, 1500);
    }, 1000);
  },

  // 跳过非必填信息
  skipUserInfo() {
    this.setData({
      loginStep: 3
    });
  },

  // 返回上一步
  goBack() {
    if (this.data.loginStep > 1) {
      this.setData({
        loginStep: this.data.loginStep - 1
      });
    }
  },

  // 跳转到登录帮助
  goToHelp() {
    wx.navigateTo({
      url: '/pages/help/login-help/login-help'
    });
  }
}); 