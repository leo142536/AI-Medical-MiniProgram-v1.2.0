const util = require('../../../utils/util');

Page({
  data: {
    formData: {
      name: '',
      relation: '',
      phone: '',
      birthday: '',
      gender: '',
      idCard: '',
      notes: ''
    },
    relationOptions: [
      { id: 'father', name: '父亲' },
      { id: 'mother', name: '母亲' },
      { id: 'spouse', name: '配偶' },
      { id: 'child', name: '子女' },
      { id: 'sibling', name: '兄弟姐妹' },
      { id: 'grandparent', name: '祖父母/外祖父母' },
      { id: 'uncle', name: '叔叔/舅舅' },
      { id: 'aunt', name: '阿姨/姨妈' },
      { id: 'other', name: '其他' }
    ],
    genderOptions: [
      { id: 'male', name: '男' },
      { id: 'female', name: '女' }
    ],
    relationIndex: -1,
    genderIndex: -1,
    avatar: ''
  },

  onLoad() {
    // 页面加载
  },

  // 表单输入处理
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 关系选择
  onRelationChange(e) {
    const index = parseInt(e.detail.value);
    const relation = this.data.relationOptions[index];
    this.setData({
      'formData.relation': relation.name,
      relationIndex: index
    });
  },

  // 性别选择
  onGenderChange(e) {
    const index = parseInt(e.detail.value);
    const gender = this.data.genderOptions[index];
    this.setData({
      'formData.gender': gender.id,
      genderIndex: index
    });
  },

  // 生日选择
  onDateChange(e) {
    this.setData({
      'formData.birthday': e.detail.value
    });
  },

  // 选择头像
  onChooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          avatar: tempFilePath
        });
      }
    });
  },

  // 检查是否重复
  checkDuplicate() {
    const { formData } = this.data;
    const familyInfo = util.getStorage('familyInfo') || { members: [] };
    
    // 检查姓名重复
    const nameExists = familyInfo.members.some(member => 
      member.name.trim() === formData.name.trim()
    );
    
    // 检查身份证号重复（如果填写了身份证号）
    let idCardExists = false;
    if (formData.idCard && formData.idCard.trim()) {
      idCardExists = familyInfo.members.some(member => 
        member.idCard && member.idCard.trim() === formData.idCard.trim()
      );
    }
    
    if (nameExists && idCardExists) {
      util.showToast('该成员已存在（姓名和身份证号重复）');
      return true;
    } else if (nameExists) {
      util.showConfirm(
        `已存在同名成员"${formData.name}"，确定要继续添加吗？`, 
        '重复提醒'
      ).then(confirmed => {
        if (confirmed) {
          this.doSave();
        }
      });
      return true;
    } else if (idCardExists) {
      util.showToast('该身份证号已存在，无法重复添加');
      return true;
    }
    
    return false;
  },

  // 表单验证
  validateForm() {
    const { formData } = this.data;
    
    console.log('验证表单数据:', formData);
    
    if (!formData.name || !formData.name.trim()) {
      util.showToast('请输入姓名');
      return false;
    }
    
    if (!formData.relation || !formData.relation.trim()) {
      util.showToast('请选择关系');
      return false;
    }
    
    // 身份证号格式验证（可选）
    if (formData.idCard && formData.idCard.trim()) {
      const idCardPattern = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
      if (!idCardPattern.test(formData.idCard.trim())) {
        util.showToast('身份证号格式不正确');
        return false;
      }
    }
    
    return true;
  },

  // 保存成员
  onSave() {
    console.log('开始保存，当前表单数据:', this.data.formData);
    
    if (!this.validateForm()) {
      return;
    }
    
    // 检查重复
    if (this.checkDuplicate()) {
      return;
    }
    
    this.doSave();
  },

  // 执行保存操作
  doSave() {
    try {
      util.showLoading('保存中...');
      
      const { formData, avatar } = this.data;
      const memberData = {
        ...formData,
        id: util.generateId ? util.generateId() : Date.now(),
        avatar: avatar || '/images/default-avatar.png',
        createTime: new Date().toISOString()
      };
      
      console.log('准备保存的成员数据:', memberData);
      
      // 获取现有家庭信息
      const familyInfo = util.getStorage('familyInfo') || { members: [] };
      console.log('现有家庭信息:', familyInfo);
      
      // 添加新成员
      familyInfo.members.push(memberData);
      
      // 保存到本地存储
      const saveResult = util.setStorage('familyInfo', familyInfo);
      console.log('保存结果:', saveResult);
      
      if (saveResult) {
        util.hideLoading();
        util.showToast('添加成功', 'success');
        
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      } else {
        throw new Error('保存失败');
      }
      
    } catch (error) {
      util.hideLoading();
      console.error('保存成员失败:', error);
      util.showToast('保存失败，请重试');
    }
  },

  // 取消
  onCancel() {
    util.showConfirm('确定要取消吗？未保存的内容将丢失', '取消添加').then(confirmed => {
      if (confirmed) {
        wx.navigateBack();
      }
    });
  },

  // 获取性别显示名称
  getGenderName(genderId) {
    if (!genderId) return '请选择性别';
    const gender = this.data.genderOptions.find(g => g.id === genderId);
    return gender ? gender.name : '请选择性别';
  }
}); 