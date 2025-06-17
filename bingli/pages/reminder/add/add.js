const util = require('../../../utils/util');

Page({
  data: {
    formData: {
      title: '',
      type: 'medical', // medical, medicine, checkup
      member: '',
      date: '',
      time: '',
      content: '',
      repeat: 'none' // none, daily, weekly, monthly
    },
    familyMembers: [],
    reminderTypes: [
      { id: 'medical', name: '就医提醒', icon: '🏥' },
      { id: 'medicine', name: '服药提醒', icon: '💊' },
      { id: 'checkup', name: '体检提醒', icon: '🩺' }
    ],
    repeatOptions: [
      { id: 'none', name: '不重复' },
      { id: 'daily', name: '每天' },
      { id: 'weekly', name: '每周' },
      { id: 'monthly', name: '每月' }
    ],
    showDatePicker: false,
    showTimePicker: false,
    showMemberPicker: false,
    showTypePicker: false,
    showRepeatPicker: false,
    calendarSupported: false
  },

  onLoad() {
    this.loadFamilyMembers();
    this.checkCalendarSupport();
    this.setDefaultDateTime();
  },

  // 检查日历支持
  checkCalendarSupport() {
    // 检查是否支持日历API
    const canUseCalendar = wx.canIUse('addPhoneCalendar');
    this.setData({
      calendarSupported: canUseCalendar
    });
  },

  // 设置默认日期时间
  setDefaultDateTime() {
    const now = new Date();
    const date = util.formatDate(now);
    const time = util.formatTime(now).substring(0, 5);
    
    this.setData({
      'formData.date': date,
      'formData.time': time
    });
  },

  // 加载家庭成员
  loadFamilyMembers() {
    const familyInfo = util.getStorage('familyInfo');
    if (familyInfo && familyInfo.members) {
      this.setData({
        familyMembers: familyInfo.members
      });
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

  // 显示选择器
  onShowPicker(e) {
    const { type } = e.currentTarget.dataset;
    const stateKey = `show${type.charAt(0).toUpperCase() + type.slice(1)}Picker`;
    this.setData({
      [stateKey]: true
    });
  },

  // 日期选择
  onDateChange(e) {
    this.setData({
      'formData.date': e.detail.value,
      showDatePicker: false
    });
  },

  // 时间选择
  onTimeChange(e) {
    this.setData({
      'formData.time': e.detail.value,
      showTimePicker: false
    });
  },

  // 成员选择
  onMemberChange(e) {
    const index = e.detail.value;
    const member = this.data.familyMembers[index];
    this.setData({
      'formData.member': member.name,
      showMemberPicker: false
    });
  },

  // 类型选择
  onTypeChange(e) {
    const index = e.detail.value;
    const type = this.data.reminderTypes[index];
    this.setData({
      'formData.type': type.id,
      showTypePicker: false
    });
  },

  // 重复选择
  onRepeatChange(e) {
    const index = e.detail.value;
    const repeat = this.data.repeatOptions[index];
    this.setData({
      'formData.repeat': repeat.id,
      showRepeatPicker: false
    });
  },

  // 取消选择器
  onDateCancel() {
    this.setData({ showDatePicker: false });
  },

  onTimeCancel() {
    this.setData({ showTimePicker: false });
  },

  onMemberCancel() {
    this.setData({ showMemberPicker: false });
  },

  onTypeCancel() {
    this.setData({ showTypePicker: false });
  },

  onRepeatCancel() {
    this.setData({ showRepeatPicker: false });
  },

  // 添加到手机日历
  async addToPhoneCalendar() {
    if (!this.data.calendarSupported) {
      wx.showToast({
        title: '当前版本不支持日历功能',
        icon: 'none'
      });
      return;
    }

    const { formData } = this.data;
    const startTime = new Date(`${formData.date} ${formData.time}`).getTime();
    const endTime = startTime + 60 * 60 * 1000; // 默认1小时

    try {
      await wx.addPhoneCalendar({
        title: formData.title,
        startTime: startTime,
        endTime: endTime,
        description: formData.content,
        location: '',
        allDay: false
      });

      wx.showToast({
        title: '已添加到日历',
        icon: 'success'
      });
    } catch (error) {
      console.error('添加到日历失败:', error);
      wx.showToast({
        title: '添加日历失败',
        icon: 'error'
      });
    }
  },

  // 表单验证
  validateForm() {
    const { formData } = this.data;
    
    if (!formData.title.trim()) {
      util.showToast('请输入提醒标题');
      return false;
    }
    
    if (!formData.member) {
      util.showToast('请选择提醒对象');
      return false;
    }
    
    if (!formData.date) {
      util.showToast('请选择提醒日期');
      return false;
    }
    
    if (!formData.time) {
      util.showToast('请选择提醒时间');
      return false;
    }
    
    return true;
  },

  // 保存提醒
  async onSave() {
    if (!this.validateForm()) {
      return;
    }
    
    try {
      util.showLoading('保存中...');
      
      const { formData } = this.data;
      const reminderData = {
        ...formData,
        id: Date.now(),
        status: 'active',
        createTime: new Date().toISOString(),
        reminderTime: new Date(`${formData.date} ${formData.time}`).toISOString()
      };
      
      // TODO: 保存到云数据库
      console.log('保存提醒数据:', reminderData);
      
      // 如果支持日历功能，询问是否添加到日历
      if (this.data.calendarSupported) {
        util.hideLoading();
        
        const res = await util.showConfirm('是否同时添加到手机日历？', '提醒已保存');
        if (res) {
          await this.addToPhoneCalendar();
        }
      } else {
        util.hideLoading();
        util.showToast('保存成功');
      }
      
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      
    } catch (error) {
      util.hideLoading();
      console.error('保存提醒失败:', error);
      util.showToast('保存失败');
    }
  },

  // 取消
  onCancel() {
    util.showConfirm('确定要取消吗？未保存的内容将丢失', '取消编辑').then(confirmed => {
      if (confirmed) {
        wx.navigateBack();
      }
    });
  },

  // 获取类型显示名称
  getTypeName(typeId) {
    const type = this.data.reminderTypes.find(t => t.id === typeId);
    return type ? type.name : '';
  },

  // 获取重复显示名称
  getRepeatName(repeatId) {
    const repeat = this.data.repeatOptions.find(r => r.id === repeatId);
    return repeat ? repeat.name : '';
  }
}); 