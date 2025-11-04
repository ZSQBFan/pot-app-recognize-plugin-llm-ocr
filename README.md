# Pot-APP LLM OCR 插件

### 一个使用视觉理解大模型进行文字识别的插件

## 🚀 使用指南

本插件是一个基于大型语言模型（LLM）的 OCR 识别插件，它依赖于阿里云的灵积（DashScope）模型服务来实现强大的视觉识别能力。

在使用前，你必须拥有一个阿里云账户（或者其他拥有视觉识别大模型的平台）并完成以下配置，此后教程以阿里千问qwen模型为例。

## 安装步骤

### 步骤一：开通阿里云百炼平台服务
- 访问：[阿里云百炼平台](https://bailian.console.aliyun.com/?spm=5176.12818093_47.resourceCenter.5.50272cc9dJ31xs&tab=doc#/doc/?type=model&url=2840915)
- 开通相关服务并获取 API Key

### 步骤二：下载并安装软件
1. 下载并安装 [Pot](https://pot-app.com/)
2. 从右侧 releases 区域下载插件
3. 打开 Pot → 服务设置 → 文字识别 → 添加外部插件 → 安装外部插件
4. 选择下载得到的 `plugin.com.pot-app.llm-ocr.potext` 文件

### 步骤三：配置 Pot 插件
打开 Pot 软件的插件设置，找到此插件，并填写以下字段：

| 配置项 | 说明 |
|--------|------|
| **配置名称** | 给这个配置起一个你喜欢的名字，例如"我的阿里 OCR" |
| **API Key** | 粘贴你在步骤一中复制的 `sk-` 开头的密钥 |
| **API 接入点** | 填写 OpenAI 兼容模式接入点：<br>`https://dashscope.aliyuncs.com/compatible-mode/v1` |
| **Prompt[可选]** | 给 AI 的指令，用于指导它如何处理图片。留空则调用默认的prompt |
| **模型[可选]** | 填写你在步骤一中开通的视觉模型名称。留空则调用默认的 `qwen3-vl-flash` |

## 开始使用
保存配置！现在，当你使用 Pot 的截图 OCR 功能时，插件会自动调用你配置的阿里云模型来为你识别文字。

## 鸣谢
- [Pot](https://pot-app.com/)
- 这个项目的初始代码和灵感大量来源于[Pot-APP Qwen OCR 插件](https://github.com/SunXin121/pot-app-recognize-plugin-qwen-ocr)
