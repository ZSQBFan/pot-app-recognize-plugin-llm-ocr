/**
 * Qwen LLM OCR 识别函数 (OpenAI-Compatible API)
 * @param {string} base64 - 图片的 base64 编码（未使用，通过缓存文件读取）
 * @param {string} lang - 语言设置（未使用）
 * @param {Object} options - 选项配置
 * @returns {Promise<string>} 识别结果
 */
async function recognize(base64, lang, options) {
  const { config, utils } = options;
  const { tauriFetch: fetch, cacheDir, readBinaryFile, http } = utils;
  // 从配置中读取 API Key、接入点和模型
  let { apiKey, endpointUrl, model, customPrompt } = config;

  // --- 参数验证 ---
  if (!apiKey) {
    throw new Error("API Key 未提供，请在插件设置中配置 API Key");
  }

  if (!endpointUrl) {
    throw new Error("API 接入点 URL 未提供，请在插件设置中配置");
  }

  if (!cacheDir) {
    throw new Error("缓存目录未找到");
  }

  // 如果没有设定 model，使用默认值
  if (!model || model.trim() === "") {
    model = "qwen3-vl-flash"; // 您可以根据需要更改默认模型
  }

  console.log(`开始尝试使用 API Key 进行 OCR 识别`);

  try {
    // --- 读取截图文件 ---
    const filePath = `${cacheDir}pot_screenshot_cut.png`;
    let fileContent;
    try {
      fileContent = await readBinaryFile(filePath);
      if (!fileContent || fileContent.length === 0) {
        throw new Error("截图文件为空");
      }
      console.log(`成功读取截图文件，大小: ${fileContent.length} 字节`);
    } catch (fileError) {
      throw new Error(`无法读取截图文件: ${fileError.message}`);
    }

    // --- 获取识别提示词 ---
    const prompt = getRecognitionPrompt(customPrompt);

    // --- 执行 OCR 识别 ---
    // http 参数在此版本中可能不需要，但保留以防万一
    const result = await performOCR(fetch, http, apiKey, endpointUrl, model, fileContent, prompt);
    
    if (result) {
      console.log(`API Key 识别成功`);
      return result;
    } else {
      // 正常情况下，如果 performOCR 返回空，应该在内部抛出错误
      throw new Error("API 返回了空结果");
    }

  } catch (error) {
    console.error(`OCR 识别失败:`, error.message);
    
    // --- 错误处理 ---
    if (isAuthenticationError(error)) {
      throw new Error("API Key 无效或已过期，请检查 API Key (HTTP 401/403)");
    } else if (error.message.includes("HTTP 404")) {
      // 404 错误现在更可能是模型名称错误或基础 URL 不对
      throw new Error("API 接入点或模型不正确，请检查 URL 和模型名称 (HTTP 404)");
    } else if (error.message.includes("网络") || error.message.includes("fetch")) {
      throw new Error("网络连接失败，请检查网络设置或 API 接入点");
    } else {
      throw new Error(`OCR 识别失败: ${error.message}`);
    }
  }
}

/**
 * 获取识别提示词 (此函数保持不变)
 * @param {string} customPrompt - 自定义提示词
 * @returns {string} 最终使用的提示词
 */
function getRecognitionPrompt(customPrompt) {
  if (customPrompt && customPrompt.trim() !== "") {
    return customPrompt.trim();
  }

  return `【角色】
你是一个专业、精准的OCR文字识别与文档数字化专家。你的核心能力是从任何给定的图片中，毫无遗漏地识别并提取所有可见的文字内容，并能智能地区分和处理普通文本、数学公式、Markdown语法及验证码。

【任务】
请对用户提供的图片进行全面的文字识别与提取。

【上下文与要求】
为了确保输出的最高质量和一致性，你必须严格遵守以下指令：

第一部分：通用文本提取规则

完整性：提取图片中所有区域的文字，包括但不限于：
主体正文文字
标题、副标题
图片、图表内的标签和注释
页眉、页脚、页码
水印、印章、手写批注
任何肉眼可辨的符号、数字、字母和标点。
保真度：
严格保持原文：绝对禁止任何形式的概括、总结、意译或创造性改写。输出必须与图片上的文字完全一致，包括可能存在的错别字、语法错误、拼写错误和不规范的标点。
保留格式线索：
使用换行来明确表示段落或明显换行。
当文本在视觉上属于不同的区块（如独立的标题栏、侧边栏、表格单元格）时，使用 [区块分隔] 进行标记。
如果文字方向是垂直的（如古诗词、某些标题），请在提取出的文字前加上 [竖排文字] 的标记。
处理不确定性：
对于模糊、低分辨率或损坏导致无法100%确认的字符，请尽最大努力识别，并在该字符后使用方括号标注不确定性，例如：模糊[？] 或 实[？/验]。
对于完全无法识别的部分，使用 [无法识别] 进行占位，并尽可能描述其位置，例如：图片右下角有一处污渍，内容[无法识别]。
第二部分：特殊内容处理规则
4. 数学公式处理：
- 所有数学公式和数学符号都必须使用标准的 LaTeX 格式。
- 行内公式使用单个 符号包裹，如：$x^2。
- 独立公式块使用两个 符号包裹，如：\sum_{i=1}^n i^2$$。
- 普通文本保持原样，不要使用 LaTeX 格式。
- 确保所有数学符号都被正确包裹在 或$ 中。
5. Markdown与代码处理：
- 对于图片中存在的 Markdown 格式，在输出中保留其原始的 Markdown 格式（如：勾选框 - 和 - [x]，引用块 > 的格式以及内容，嵌套引用，嵌套列表，以及其他更多 Markdown 语法）。
- 对于代码块，使用 Markdown 格式输出。
6. 验证码处理：
- 如果图片被识别为验证码，只输出验证码字符本身，不要加任何额外解释。
- 忽略干扰线和噪点。
- 注意区分相似字符，如 0 和 O、1 和 l、2 和 Z、5 和 S、6 和 G、8 和 B、9 和 q、7 和 T、4 和 A 等。
- 验证码通常为 4-6 位字母数字组合。
7. 语言与编码：
- 识别并正确输出多种语言的文字（如中文、英文、数字、标点等）。
- 确保输出使用UTF-8编码，以避免乱码。

【输出格式】
你的最终输出必须且只能是一个纯净的文本块`;
}

/**
 * 执行 OCR 识别 (OpenAI-Compatible API)
 * @param {Function} fetch - 网络请求函数
 * @param {Object} http - HTTP 工具对象 (此版本中可能未使用)
 * @param {string} apiKey - API Key
 * @param {string} endpointUrl - API 接入点 URL (将会被处理)
 * @param {string} model - 使用的模型
 * @param {Uint8Array} fileContent - 图片文件内容 (二进制)
 * @param {string} prompt - 识别提示词
 * @returns {Promise<string|null>} 识别结果或 null
 */
async function performOCR(fetch, http, apiKey, endpointUrl, model, fileContent, prompt) {
  try {
    // --- 1. 将图片文件内容转换为 Base64 ---
    const imageBase64 = arrayBufferToBase64(fileContent);
    const imageUrl = `data:image/png;base64,${imageBase64}`;

    // --- 2. 构建 OpenAI 兼容的请求体 ---
    const requestBody = {
      model: model,
      stream: false, // Pot 插件通常不支持流式返回，改为 false
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      // max_tokens: 2048, 
    };

    // --- 3. 处理 Endpoint URL ---
    let finalUrl = endpointUrl;
    // 移除末尾可能存在的斜杠，避免出现 .../v1//chat/completions
    if (finalUrl.endsWith('/')) {
      finalUrl = finalUrl.slice(0, -1);
    }
    // 检查是否已经以 /chat/completions 结尾，如果没有，则自动添加
    if (!finalUrl.endsWith('/chat/completions')) {
      finalUrl += '/chat/completions';
    }
    // --- 修改结束 ---

    // --- 4. 发送 OCR 识别请求 ---
    //  使用 finalUrl 并更新日志
    console.log("开始发送 OCR 识别请求至 (Processed):", finalUrl);
    const recognitionResponse = await fetch(finalUrl, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "user-agent": "Pot-Plugin-Qwen-OCR (OpenAI-Compatible)",
      },
      body: http.Body.json(requestBody), // 假设 http.Body.json 存在
    });

    if (!recognitionResponse.ok) {
      // 抛出包含 HTTP 状态的错误
      throw new Error(`OCR 请求失败: HTTP ${recognitionResponse.status} ${recognitionResponse.statusText}`);
    }

    const recognitionData = recognitionResponse.data;
    if (!recognitionData || !recognitionData.choices || !recognitionData.choices[0]) {
      throw new Error("OCR 响应格式错误：未找到识别结果 (choices)");
    }

    const result = recognitionData.choices[0].message?.content;
    if (!result) {
      throw new Error("OCR 识别结果为空 (message.content)");
    }

    console.log("OCR 识别成功");
    return result.trim();

  } catch (error) {
    console.error("OCR 执行失败:", error.message);
    throw error; // 将错误向上抛出给 recognize 函数处理
  }
}

/**
 * 判断是否为认证相关错误 (此函数保持不变)
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否为认证错误
 */
function isAuthenticationError(error) {
  const authErrorMessages = [
    "unauthorized",
    "token",
    "cookie",
    "authentication",
    "401", // 未授权
    "403", // 禁止
    "invalid api key",
    "expired"
  ];
  
  const errorMessage = error.message.toLowerCase();
  return authErrorMessages.some(msg => errorMessage.includes(msg));
}

/**
 * [新增] 将 ArrayBuffer (Uint8Array) 转换为 Base64 字符串
 * @param {Uint8Array} buffer - 文件内容的字节数组
 * @returns {string} Base64 编码的字符串
 */
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    // 假设环境中存在 btoa 函数 (Tauri/浏览器环境通常有)
    if (typeof btoa === 'function') {
        return btoa(binary);
    } else {
        // 如果在 Node.js 环境中（不太可能，因为有 tauriFetch）
        // return Buffer.from(buffer).toString('base64');
        throw new Error("btoa (Base64 encoding) function not found.");
    }
}