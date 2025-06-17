const util = require('../../../utils/util');

Page({
  data: {
    recordId: '',
    isEdit: false,
    formData: {
      title: '',
      date: '',
      time: '',
      member: '',
      hospital: '',
      department: '',
      doctor: '',
      diagnosis: '',
      symptoms: '',
      treatment: '',
      notes: '',
      cost: '',
      nextVisit: ''
    },
    prescriptions: [],
    images: [],
    familyMembers: [],
    showDatePicker: false,
    showTimePicker: false,
    showMemberPicker: false,
    currentImageIndex: -1
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ 
        recordId: id,
        isEdit: true 
      });
      this.loadRecordData(id);
    } else {
      this.initNewRecord();
    }
    this.loadFamilyMembers();
  },

  // 初始化新病历
  initNewRecord() {
    const today = new Date();
    const currentTime = util.formatTime(today).split(' ')[1];
    
    this.setData({
      'formData.date': util.formatDate(today),
      'formData.time': currentTime.substring(0, 5) // HH:MM格式
    });
  },

  // 加载病历数据
  loadRecordData(id) {
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
      notes: '病情较轻，按时服药即可恢复',
      cost: '168.50',
      nextVisit: '2024-12-25'
    };
    
    this.setData({
      formData: mockData,
      prescriptions: [
        {
          name: '阿莫西林胶囊',
          dosage: '0.25g',
          frequency: '每日3次',
          duration: '7天'
        }
      ]
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

  // 日期选择取消
  onDateCancel() {
    this.setData({
      showDatePicker: false
    });
  },

  // 时间选择取消
  onTimeCancel() {
    this.setData({
      showTimePicker: false
    });
  },

  // 成员选择取消
  onMemberCancel() {
    this.setData({
      showMemberPicker: false
    });
  },

  // 显示选择器
  onShowPicker(e) {
    const { type } = e.currentTarget.dataset;
    switch(type) {
      case 'date':
        this.setData({ showDatePicker: true });
        break;
      case 'time':
        this.setData({ showTimePicker: true });
        break;
      case 'member':
        this.setData({ showMemberPicker: true });
        break;
    }
  },

  // 添加处方
  onAddPrescription() {
    wx.navigateTo({
      url: '/pages/record/prescription/prescription'
    });
  },

  // 编辑处方
  onEditPrescription(e) {
    const { index } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/record/prescription/prescription?index=${index}`
    });
  },

  // 删除处方
  onDeletePrescription(e) {
    const { index } = e.currentTarget.dataset;
    const prescriptions = this.data.prescriptions;
    prescriptions.splice(index, 1);
    this.setData({ prescriptions });
  },

  // 选择图片
  onChooseImage() {
    wx.chooseMedia({
      count: 9 - this.data.images.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles.map(file => file.tempFilePath);
        const images = [...this.data.images, ...tempFiles];
        this.setData({ images });
      }
    });
  },

  // 预览图片
  onPreviewImage(e) {
    const { index } = e.currentTarget.dataset;
    wx.previewImage({
      current: this.data.images[index],
      urls: this.data.images
    });
  },

  // 删除图片
  onDeleteImage(e) {
    const { index } = e.currentTarget.dataset;
    const images = this.data.images;
    images.splice(index, 1);
    this.setData({ images });
  },

  // 表单验证
  validateForm() {
    const { formData } = this.data;
    
    if (!formData.title.trim()) {
      util.showToast('请输入病历标题');
      return false;
    }
    
    if (!formData.date) {
      util.showToast('请选择就诊日期');
      return false;
    }
    
    if (!formData.member) {
      util.showToast('请选择就诊人员');
      return false;
    }
    
    if (!formData.hospital.trim()) {
      util.showToast('请输入医院名称');
      return false;
    }
    
    return true;
  },

  // 保存病历
  onSave() {
    if (!this.validateForm()) {
      return;
    }
    
    util.showLoading('保存中...');
    
    // TODO: 上传图片和保存数据到云数据库
    setTimeout(() => {
      util.hideLoading();
      util.showToast('保存成功');
      
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    }, 1500);
  },

  // 取消编辑
  onCancel() {
    util.showConfirm('确定要取消编辑吗？未保存的内容将丢失', '取消编辑').then(confirmed => {
      if (confirmed) {
        wx.navigateBack();
      }
    });
  }
}); 