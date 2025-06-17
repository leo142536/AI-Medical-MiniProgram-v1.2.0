const util = require('../../../utils/util');

Page({
  data: {
    recordId: '',
    recordDetail: null,
    showShareModal: false,
    editMode: false
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ recordId: id });
      this.loadRecordDetail(id);
    } else {
      util.showToast('参数错误');
      wx.navigateBack();
    }
  },

  onShow() {
    if (this.data.recordId) {
      this.loadRecordDetail(this.data.recordId);
    }
  },

  // 加载病历详情
  loadRecordDetail(id) {
    // TODO: 从云数据库加载
    const mockData = {
      id: id,
      title: '感冒就诊记录',
      date: '2024-12-18',
      time: '14:30',
      member: '张三',
      hospital: '中山医院',
      department: '呼吸内科',
      doctor: '李医生',
      diagnosis: '急性上呼吸道感染',
      symptoms: '咳嗽、流鼻涕、轻微发热',
      treatment: '开具感冒药物，注意休息多喝水',
      prescriptions: [
        {
          name: '阿莫西林胶囊',
          dosage: '0.25g',
          frequency: '每日3次',
          duration: '7天'
        },
        {
          name: '感冒清热颗粒',
          dosage: '1袋',
          frequency: '每日2次',
          duration: '5天'
        }
      ],
      images: [
        '/images/mock-prescription1.jpg',
        '/images/mock-prescription2.jpg'
      ],
      notes: '病情较轻，按时服药即可恢复',
      nextVisit: '2024-12-25',
      cost: '168.50',
      createTime: '2024-12-18 15:00:00',
      updateTime: '2024-12-18 15:00:00'
    };

    this.setData({
      recordDetail: mockData
    });
  },

  // 编辑病历
  onEdit() {
    wx.navigateTo({
      url: `/pages/record/edit/edit?id=${this.data.recordId}`
    });
  },

  // 删除病历
  onDelete() {
    util.showConfirm('确定要删除这条病历记录吗？', '删除确认').then(confirmed => {
      if (confirmed) {
        // TODO: 调用删除接口
        util.showToast('删除成功');
        wx.navigateBack();
      }
    });
  },

  // 分享病历
  onShare() {
    this.setData({
      showShareModal: true
    });
  },

  // 关闭分享弹窗
  onCloseShareModal() {
    this.setData({
      showShareModal: false
    });
  },

  // 分享给家人
  onShareToFamily() {
    util.showToast('已分享给家庭成员');
    this.onCloseShareModal();
  },

  // 导出PDF
  onExportPDF() {
    util.showToast('PDF导出功能开发中');
    this.onCloseShareModal();
  },

  // 预览图片
  onPreviewImage(e) {
    const { url, urls } = e.currentTarget.dataset;
    wx.previewImage({
      current: url,
      urls: urls
    });
  },

  // 拨打医院电话
  onCallHospital() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
      fail: () => {
        util.showToast('请手动拨打医院电话');
      }
    });
  },

  // 导航到医院
  onNavigateToHospital() {
    wx.openLocation({
      latitude: 23.099994,
      longitude: 113.324520,
      name: this.data.recordDetail.hospital,
      address: '广州市越秀区中山二路58号',
      fail: () => {
        util.showToast('无法获取医院位置');
      }
    });
  },

  // 设置复诊提醒
  onSetReminder() {
    wx.navigateTo({
      url: '/pages/reminder/add/add?type=medical&recordId=' + this.data.recordId
    });
  }
}); 