const util = require('../../utils/util');

Page({
  data: {
    familyInfo: null,
    members: [],
    isAdmin: false,
    showAddMember: false
  },

  onLoad() {
    this.loadFamilyData();
  },

  onShow() {
    this.loadFamilyData();
  },

  // 加载家庭数据
  loadFamilyData() {
    const familyInfo = util.getStorage('familyInfo');
    const userInfo = util.getStorage('userInfo');
    
    if (!familyInfo) {
      wx.showToast({
        title: '未找到家庭信息',
        icon: 'none'
      });
      return;
    }

    // 检查当前用户是否为管理员
    const currentUserMember = familyInfo.members.find(
      member => member.name === userInfo.name
    );
    
    this.setData({
      familyInfo: familyInfo,
      members: familyInfo.members,
      isAdmin: currentUserMember && currentUserMember.role === 'admin'
    });
  },

  // 添加家庭成员
  onAddMember() {
    if (!this.data.isAdmin) {
      util.showToast('只有管理员才能添加成员');
      return;
    }
    
    wx.navigateTo({
      url: '/pages/family/add/add'
    });
  },

  // 查看成员详情
  onMemberTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/family/detail/detail?id=${id}`
    });
  },

  // 编辑家庭信息
  onEditFamily() {
    if (!this.data.isAdmin) {
      util.showToast('只有管理员才能编辑家庭信息');
      return;
    }
    
    wx.navigateTo({
      url: '/pages/family/edit/edit'
    });
  },

  // 分享家庭
  onShareFamily() {
    // TODO: 实现家庭邀请功能
    util.showToast('分享功能开发中');
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadFamilyData();
    wx.stopPullDownRefresh();
  }
}); 