#!/usr/bin/env node

/**
 * 文档同步脚本
 * 将 bingli/ 目录中的文档同步到 docs/ 目录，便于离线查看
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
  sourceDir: 'bingli',
  targetDir: 'docs/requirements',
  apiDir: 'docs/api',
  backupDir: 'docs/backup'
};

// 文件映射关系
const fileMapping = {
  '1.总览与规范.md': '01_总览与规范.md',
  '01_FR1_用户家庭管理.md': '02_FR1_用户家庭管理.md',
  '02_FR2_病历管理.md': '03_FR2_病历管理.md',
  '03_FR3_健康提醒.md': '04_FR3_健康提醒.md',
  '04_FR4_安全设置.md': '05_FR4_安全设置.md',
  '3.状态机.md': '06_状态机设计.md',
  '5.验收要求.md': '07_验收要求.md',
  '06_API集合.postman_collection.json': 'postman-collection.json'
};

/**
 * 确保目录存在
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ 创建目录: ${dirPath}`);
  }
}

/**
 * 复制文件
 */
function copyFile(source, target) {
  try {
    const content = fs.readFileSync(source, 'utf8');
    fs.writeFileSync(target, content, 'utf8');
    console.log(`📄 同步文件: ${path.basename(source)} → ${path.basename(target)}`);
    return true;
  } catch (error) {
    console.error(`❌ 复制文件失败: ${source} → ${target}`, error.message);
    return false;
  }
}

/**
 * 备份现有文档
 */
function backupExistingDocs() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(config.backupDir, timestamp);
  
  if (fs.existsSync(config.targetDir)) {
    ensureDir(backupPath);
    
    const files = fs.readdirSync(config.targetDir);
    files.forEach(file => {
      const source = path.join(config.targetDir, file);
      const target = path.join(backupPath, file);
      
      if (fs.statSync(source).isFile()) {
        copyFile(source, target);
      }
    });
    
    console.log(`💾 备份完成: ${backupPath}`);
  }
}

/**
 * 同步文档
 */
function syncDocuments() {
  console.log('🚀 开始同步文档...\n');
  
  // 确保目标目录存在
  ensureDir(config.targetDir);
  ensureDir(config.apiDir);
  ensureDir(config.backupDir);
  
  // 备份现有文档
  backupExistingDocs();
  
  let successCount = 0;
  let totalCount = 0;
  
  // 同步文档文件
  Object.entries(fileMapping).forEach(([sourceFile, targetFile]) => {
    const sourcePath = path.join(config.sourceDir, sourceFile);
    
    if (!fs.existsSync(sourcePath)) {
      console.log(`⚠️  源文件不存在: ${sourcePath}`);
      return;
    }
    
    totalCount++;
    
    // 确定目标路径
    let targetPath;
    if (sourceFile.endsWith('.json')) {
      targetPath = path.join(config.apiDir, targetFile);
    } else {
      targetPath = path.join(config.targetDir, targetFile);
    }
    
    // 复制文件
    if (copyFile(sourcePath, targetPath)) {
      successCount++;
    }
  });
  
  // 同步其他文件
  const otherFiles = ['app.js', 'app.json', 'app.wxss', 'sitemap.json'];
  otherFiles.forEach(file => {
    const sourcePath = path.join(config.sourceDir, file);
    const targetPath = path.join('docs/development', file);
    
    if (fs.existsSync(sourcePath)) {
      ensureDir('docs/development');
      totalCount++;
      if (copyFile(sourcePath, targetPath)) {
        successCount++;
      }
    }
  });
  
  console.log(`\n📊 同步完成: ${successCount}/${totalCount} 个文件同步成功`);
  
  // 生成同步报告
  generateSyncReport(successCount, totalCount);
}

/**
 * 生成同步报告
 */
function generateSyncReport(successCount, totalCount) {
  const report = {
    timestamp: new Date().toISOString(),
    success: successCount,
    total: totalCount,
    status: successCount === totalCount ? 'success' : 'partial',
    files: Object.entries(fileMapping).map(([source, target]) => ({
      source,
      target,
      exists: fs.existsSync(path.join(config.sourceDir, source)),
      synced: fs.existsSync(path.join(
        source.endsWith('.json') ? config.apiDir : config.targetDir,
        target
      ))
    }))
  };
  
  const reportPath = path.join('docs', 'sync-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📋 同步报告已生成: ${reportPath}`);
}

/**
 * 创建索引文件
 */
function createIndex() {
  const indexContent = `# 需求文档索引

## 📋 文档列表

${Object.entries(fileMapping)
  .filter(([source]) => source.endsWith('.md'))
  .map(([source, target]) => {
    const title = target.replace(/^\d+_/, '').replace('.md', '');
    return `- [${title}](./${target})`;
  })
  .join('\n')}

## 📅 最后更新

${new Date().toLocaleString('zh-CN')}

---

*此文件由同步脚本自动生成*
`;
  
  const indexPath = path.join(config.targetDir, 'INDEX.md');
  fs.writeFileSync(indexPath, indexContent);
  console.log(`📑 索引文件已创建: ${indexPath}`);
}

/**
 * 清理旧备份
 */
function cleanOldBackups() {
  if (!fs.existsSync(config.backupDir)) return;
  
  const backups = fs.readdirSync(config.backupDir)
    .filter(name => fs.statSync(path.join(config.backupDir, name)).isDirectory())
    .sort()
    .reverse();
  
  // 保留最近5个备份
  const toDelete = backups.slice(5);
  
  toDelete.forEach(backup => {
    const backupPath = path.join(config.backupDir, backup);
    fs.rmSync(backupPath, { recursive: true, force: true });
    console.log(`🗑️  删除旧备份: ${backup}`);
  });
}

/**
 * 主函数
 */
function main() {
  try {
    console.log('📚 AI病例管理系统 - 文档同步工具');
    console.log('=' .repeat(50));
    
    syncDocuments();
    createIndex();
    cleanOldBackups();
    
    console.log('\n✨ 文档同步完成！');
    console.log('\n💡 使用建议:');
    console.log('   - 使用 Typora 或 VS Code 查看文档');
    console.log('   - 运行 "docsify serve docs" 启动本地文档服务');
    console.log('   - 查看 docs/sync-report.json 了解同步详情');
    
  } catch (error) {
    console.error('❌ 同步过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  syncDocuments,
  config,
  fileMapping
}; 