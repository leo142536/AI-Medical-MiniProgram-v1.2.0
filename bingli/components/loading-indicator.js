// 现代化加载指示器组件
// 基于GitHub最佳实践设计

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 加载类型
    type: {
      type: String,
      value: 'spinner' // dots, spinner, pulse, skeleton, wave, default
    },
    
    // 显示文字
    text: {
      type: String,
      value: ''
    },
    
    // 是否显示
    show: {
      type: Boolean,
      value: true
    },
    
    // 自定义样式类
    extClass: {
      type: String,
      value: ''
    },
    
    // 文字样式类
    textClass: {
      type: String,
      value: ''
    },
    
    // 大小 small, medium, large
    size: {
      type: String,
      value: 'medium'
    },
    
    // 延迟显示时间（毫秒）
    delay: {
      type: Number,
      value: 0
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    displayStyle: '',
    isVisible: false
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.updateDisplay();
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'show,delay': function(show, delay) {
      this.updateDisplay();
    },
    
    'size': function(size) {
      this.updateSize();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 更新显示状态
     */
    updateDisplay() {
      const { show, delay } = this.data;
      
      if (show) {
        if (delay > 0) {
          // 延迟显示
          setTimeout(() => {
            this.setData({
              isVisible: true,
              displayStyle: 'display: flex;'
            });
          }, delay);
        } else {
          // 立即显示
          this.setData({
            isVisible: true,
            displayStyle: 'display: flex;'
          });
        }
      } else {
        // 隐藏
        this.setData({
          isVisible: false,
          displayStyle: 'display: none;'
        });
      }
    },

    /**
     * 更新组件大小
     */
    updateSize() {
      const { size } = this.data;
      let sizeClass = '';
      
      switch (size) {
        case 'small':
          sizeClass = 'loading-small';
          break;
        case 'large':
          sizeClass = 'loading-large';
          break;
        default:
          sizeClass = 'loading-medium';
      }
      
      this.setData({
        sizeClass
      });
    },

    /**
     * 手动显示加载器
     */
    showLoading() {
      this.setData({
        show: true
      });
      this.updateDisplay();
    },

    /**
     * 手动隐藏加载器
     */
    hideLoading() {
      this.setData({
        show: false
      });
      this.updateDisplay();
    },

    /**
     * 切换加载类型
     * @param {String} type 新的加载类型
     */
    changeType(type) {
      this.setData({
        type
      });
    },

    /**
     * 更新加载文字
     * @param {String} text 新的文字内容
     */
    updateText(text) {
      this.setData({
        text
      });
    }
  }
}); 