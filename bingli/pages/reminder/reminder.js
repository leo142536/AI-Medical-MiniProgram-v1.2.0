// pages/reminder/reminder.js
const cloudDB = require('../../services/cloudDatabase');
const util = require('../../utils/util');

Page({
  data: {
    reminders: [],
    todayReminders: [],
    upcomingReminders: [],
    selectedDate: '',
    showDatePicker: false,
    activeTab: 0,
    tabs: ['今日', '即将到来', '全部'],
    loading: false
  },

  onLoad() {
    this.setData({
      selectedDate: util.formatDate(new Date())
    });
    this.loadReminders();
  },

  onShow() {
    this.loadReminders();
  },

  // 加载提醒数据
  async loadReminders() {
    if (this.data.loading) return;
    
    try {
      this.setData({ loading: true });
      
      // 从云数据库获取提醒
      const allReminders = await cloudDB.getReminders();
      
      console.log('获取到提醒数据:', allReminders);
      
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];
      
      // 分类提醒
      const todayReminders = allReminders.filter(item => {
        const reminderDate = item.time.split('T')[0];
        return reminderDate === today && item.status === 'active';
      });
      
      const upcomingReminders = allReminders.filter(item => {
        const reminderDate = item.time.split('T')[0];
        return reminderDate > today && item.status === 'active';
      });
      
      this.setData({
        reminders: allReminders,
        todayReminders,
        upcomingReminders,
        loading: false
      });
      
    } catch (error) {
      console.error('加载提醒失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    }
  },

  // 切换标签
  onTabChange(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({
      activeTab: index
    });
  },

  // 添加提醒
  onAddReminder() {
    wx.navigateTo({
      url: '/pages/reminder/add/add'
    });
  },

  // 提醒项点击
  onReminderTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/reminder/detail/detail?id=${id}`
    });
  },

  // 完成提醒
  async onCompleteReminder(e) {
    const { id } = e.currentTarget.dataset;
    
    try {
      wx.showLoading({ title: '处理中...' });
      
      // 更新提醒状态为已完成
      await cloudDB.completeReminder(id);
      
      wx.hideLoading();
      util.showToast('已完成');
      
      // 重新加载数据
      this.loadReminders();
      
    } catch (error) {
      wx.hideLoading();
      console.error('完成提醒失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      });
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadReminders();
    wx.stopPullDownRefresh();
  }
}); 