/* global getCurrentPages */
const util = require('../../../utils/util');
const InteractionFeedback = require('../../../utils/interaction-feedback');

Page({
  data: {
    formData: {
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      note: ''
    },
    isEdit: false,
    prescriptionIndex: -1,
    loading: false,
    frequencyOptions: [
      '每日1次',
      '每日2次',
      '每日3次',
      '每8小时1次',
      '每12小时1次',
      '饭前服用',
      '饭后服用',
      '睡前服用',
      '按需服用'
    ],
    durationOptions: [
      '3天',
      '5天',
      '7天',
      '10天',
      '14天',
      '21天',
      '30天',
      '长期服用'
    ]
  },

  onLoad(options) {
    const { index } = options;
    this.setData({ loading: true });
    InteractionFeedback.showLoading('正在加载处方编辑器...');
    
    if (index !== undefined) {
      this.setData({
        isEdit: true,
        prescriptionIndex: parseInt(index)
      });
      this.loadPrescriptionData(index);
    }
    
    this.setData({ loading: false });
    InteractionFeedback.hideLoading();
  },

  // 加载处方数据
  loadPrescriptionData(index) {
    // 从上一页获取数据，这里使用模拟数据
    const prescriptionData = {
      name: '阿莫西林胶囊',
      dosage: '0.25g',
      frequency: '每日3次',
      duration: '7天',
      note: '饭后服用，多喝水'
    };
    
    this.setData({
      formData: prescriptionData
    });
  },

  // 表单输入处理
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 频次选择
  onFrequencyChange(e) {
    const index = e.detail.value;
    this.setData({
      'formData.frequency': this.data.frequencyOptions[index]
    });
  },

  // 用药时长选择
  onDurationChange(e) {
    const index = e.detail.value;
    this.setData({
      'formData.duration': this.data.durationOptions[index]
    });
  },

  // 验证表单
  validateForm() {
    const { formData } = this.data;
    
    if (!formData.name.trim()) {
      InteractionFeedback.showError('请输入药物名称');
      return false;
    }
    
    if (!formData.dosage.trim()) {
      InteractionFeedback.showError('请输入用药剂量');
      return false;
    }
    
    if (!formData.frequency) {
      InteractionFeedback.showError('请选择用药频次');
      return false;
    }
    
    if (!formData.duration) {
      InteractionFeedback.showError('请选择用药时长');
      return false;
    }
    
    return true;
  },

  // 保存处方
  onSave() {
    if (!this.validateForm()) {
      return;
    }
    
    InteractionFeedback.showLoading('正在保存处方...');
    
    const { formData } = this.data;
    
    // 返回上一页并传递数据
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    
    if (prevPage) {
      // 获取上一页的处方列表
      let prescriptions = prevPage.data.prescriptions || [];
      
      if (this.data.isEdit) {
        // 编辑模式：更新现有处方
        prescriptions[this.data.prescriptionIndex] = { ...formData };
      } else {
        // 新增模式：添加新处方
        prescriptions.push({ ...formData });
      }
      
      // 更新上一页数据
      prevPage.setData({
        prescriptions
      });
    }
    
    setTimeout(() => {
      InteractionFeedback.hideLoading();
      const action = this.data.isEdit ? '更新' : '添加';
      InteractionFeedback.showSuccess(`处方${action}成功`);
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    }, 1000);
  },

  // 取消编辑
  onCancel() {
    InteractionFeedback.showConfirm('确定要放弃编辑吗？', '未保存的内容将丢失').then(confirmed => {
      if (confirmed) {
        wx.navigateBack();
      }
    });
  },

  // 快速设置常用药物
  onQuickSetMedicine(e) {
    const { medicine } = e.currentTarget.dataset;
    
    const quickMedicines = {
      '感冒药': {
        name: '感冒清热颗粒',
        dosage: '1袋',
        frequency: '每日3次',
        duration: '5天'
      },
      '退烧药': {
        name: '布洛芬缓释胶囊',
        dosage: '0.3g',
        frequency: '每8小时1次',
        duration: '按需服用'
      },
      '止咳药': {
        name: '川贝枇杷膏',
        dosage: '10ml',
        frequency: '每日3次',
        duration: '7天'
      },
      '消炎药': {
        name: '阿莫西林胶囊',
        dosage: '0.25g',
        frequency: '每日3次',
        duration: '7天'
      }
    };
    
    const medicineData = quickMedicines[medicine];
    if (medicineData) {
      this.setData({
        formData: {
          ...this.data.formData,
          ...medicineData
        }
      });
    }
  },

  // 操作按钮事件处理
  onActionTap(e) {
    const detail = e.detail;
    if (detail && detail.buttonIndex !== undefined) {
      if (detail.buttonIndex === 0) {
        // 取消
        this.onCancel();
      } else if (detail.buttonIndex === 1) {
        // 保存
        this.onSave();
      }
    }
  }
}); 